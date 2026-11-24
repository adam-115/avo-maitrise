package com.avo.services.mail;

import com.avo.dtos.mail.InboxEmailDTO;
import com.avo.entities.MailAccount;
import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeUtility;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

/**
 * Client IMAP strictement en LECTURE SEULE (Folder.READ_ONLY) + parseur de fichiers .eml.
 * Utilise jakarta.mail (déjà fourni par spring-boot-starter-mail).
 */
@Component
@Slf4j
public class ImapReadOnlyClient {

    public record RawAttachment(String filename, String contentType, byte[] data) {}

    public record ParsedEmail(InboxEmailDTO dto, List<RawAttachment> attachments) {}

    public void testConnection(String host, int port, boolean ssl, String username, String password) {
        Store store = null;
        try {
            store = openStore(host, port, ssl, username, password);
            Folder inbox = store.getFolder("INBOX");
            inbox.open(Folder.READ_ONLY);
            inbox.close(false);
        } catch (Exception e) {
            throw new IllegalArgumentException("Connexion IMAP impossible : " + e.getMessage(), e);
        } finally {
            closeQuietly(store);
        }
    }

    public List<InboxEmailDTO> listMessages(MailAccount account, String password, String searchQuery, int limit) {
        Store store = null;
        Folder inbox = null;
        List<InboxEmailDTO> result = new ArrayList<>();
        try {
            store = openStore(
                    account.getImapHost(),
                    account.getImapPort() != null ? account.getImapPort() : 993,
                    account.getImapSsl() == null || account.getImapSsl(),
                    account.getImapUsername() != null && !account.getImapUsername().isBlank()
                            ? account.getImapUsername() : account.getEmailAddress(),
                    password);
            inbox = store.getFolder("INBOX");
            inbox.open(Folder.READ_ONLY);

            int total = inbox.getMessageCount();
            if (total == 0) return result;

            int fetchCount = Math.min(total, Math.max(limit * 2, 40));
            int start = Math.max(1, total - fetchCount + 1);
            Message[] messages = inbox.getMessages(start, total);

            FetchProfile fp = new FetchProfile();
            fp.add(FetchProfile.Item.ENVELOPE);
            fp.add(UIDFolder.FetchProfileItem.UID);
            inbox.fetch(messages, fp);

            UIDFolder uidFolder = (inbox instanceof UIDFolder uf) ? uf : null;
            String q = searchQuery != null ? searchQuery.trim().toLowerCase(Locale.ROOT) : "";

            for (int i = messages.length - 1; i >= 0 && result.size() < limit; i--) {
                Message msg = messages[i];
                InboxEmailDTO dto = toSummaryDto(msg, uidFolder);
                if (!q.isEmpty()) {
                    String hay = ((dto.getSubject() != null ? dto.getSubject() : "") + " " +
                            (dto.getFromEmail() != null ? dto.getFromEmail() : "") + " " +
                            (dto.getFromName() != null ? dto.getFromName() : "")).toLowerCase(Locale.ROOT);
                    if (!hay.contains(q)) continue;
                }
                result.add(dto);
            }
            return result;
        } catch (Exception e) {
            throw new RuntimeException("Erreur lecture IMAP : " + e.getMessage(), e);
        } finally {
            closeQuietly(inbox);
            closeQuietly(store);
        }
    }

    public ParsedEmail getFullMessage(MailAccount account, String password, String externalMessageId) {
        Store store = null;
        Folder inbox = null;
        try {
            store = openStore(
                    account.getImapHost(),
                    account.getImapPort() != null ? account.getImapPort() : 993,
                    account.getImapSsl() == null || account.getImapSsl(),
                    account.getImapUsername() != null && !account.getImapUsername().isBlank()
                            ? account.getImapUsername() : account.getEmailAddress(),
                    password);
            inbox = store.getFolder("INBOX");
            inbox.open(Folder.READ_ONLY);

            Message target = null;
            if (externalMessageId.startsWith("UID:") && inbox instanceof UIDFolder uf) {
                long uid = Long.parseLong(externalMessageId.substring(4));
                target = uf.getMessageByUID(uid);
            }
            if (target == null) {
                int total = inbox.getMessageCount();
                int start = Math.max(1, total - 150);
                for (Message m : inbox.getMessages(start, total)) {
                    String[] hdr = m.getHeader("Message-ID");
                    if (hdr != null && hdr.length > 0 && externalMessageId.equals(hdr[0])) {
                        target = m;
                        break;
                    }
                }
            }
            if (target == null) {
                throw new IllegalArgumentException("Message IMAP introuvable : " + externalMessageId);
            }
            return parseMessage(target, externalMessageId, MailAccount.PROVIDER_IMAP);
        } catch (Exception e) {
            throw new RuntimeException("Erreur récupération message IMAP : " + e.getMessage(), e);
        } finally {
            closeQuietly(inbox);
            closeQuietly(store);
        }
    }

    public ParsedEmail parseEmlBytes(byte[] emlBytes) {
        try {
            Session session = Session.getInstance(new Properties());
            MimeMessage msg = new MimeMessage(session, new ByteArrayInputStream(emlBytes));
            String msgId = msg.getMessageID();
            if (msgId == null || msgId.isBlank()) {
                msgId = "eml-" + UUID.randomUUID();
            }
            return parseMessage(msg, msgId, "EML_UPLOAD");
        } catch (Exception e) {
            throw new IllegalArgumentException("Impossible de lire le fichier .eml : " + e.getMessage(), e);
        }
    }

    private Store openStore(String host, int port, boolean ssl, String username, String password) throws Exception {
        Properties props = new Properties();
        String protocol = ssl ? "imaps" : "imap";
        props.put("mail.store.protocol", protocol);
        props.put("mail." + protocol + ".host", host);
        props.put("mail." + protocol + ".port", String.valueOf(port));
        props.put("mail." + protocol + ".connectiontimeout", "10000");
        props.put("mail." + protocol + ".timeout", "15000");
        if (ssl) {
            props.put("mail.imaps.ssl.enable", "true");
        } else {
            props.put("mail.imap.starttls.enable", "true");
        }
        Session session = Session.getInstance(props);
        Store store = session.getStore(protocol);
        store.connect(host, port, username, password);
        return store;
    }

    private InboxEmailDTO toSummaryDto(Message msg, UIDFolder uidFolder) throws Exception {
        InboxEmailDTO dto = new InboxEmailDTO();
        dto.setProvider(MailAccount.PROVIDER_IMAP);
        String extId = null;
        if (uidFolder != null) {
            long uid = uidFolder.getUID(msg);
            if (uid > 0) extId = "UID:" + uid;
        }
        if (extId == null) {
            String[] hdr = msg.getHeader("Message-ID");
            extId = (hdr != null && hdr.length > 0) ? hdr[0] : "imap-" + msg.getMessageNumber();
        }
        dto.setExternalMessageId(extId);
        fillHeaders(msg, dto);
        return dto;
    }

    private ParsedEmail parseMessage(Message msg, String extId, String provider) throws Exception {
        InboxEmailDTO dto = new InboxEmailDTO();
        dto.setProvider(provider);
        dto.setExternalMessageId(extId);
        fillHeaders(msg, dto);

        StringBuilder textBody = new StringBuilder();
        StringBuilder htmlBody = new StringBuilder();
        List<RawAttachment> attachments = new ArrayList<>();
        extractParts(msg, textBody, htmlBody, attachments);

        String plain = textBody.toString().trim();
        String html = htmlBody.toString().trim();
        dto.setBodyText(plain);
        dto.setBodyHtml(html);
        String snippetSource = !plain.isEmpty() ? plain : html.replaceAll("<[^>]+>", " ");
        snippetSource = snippetSource.replaceAll("\\s+", " ").trim();
        dto.setSnippet(snippetSource.length() > 280 ? snippetSource.substring(0, 280) + "…" : snippetSource);

        List<InboxEmailDTO.AttachmentMeta> metas = new ArrayList<>();
        for (int i = 0; i < attachments.size(); i++) {
            RawAttachment att = attachments.get(i);
            metas.add(new InboxEmailDTO.AttachmentMeta("att-" + i, att.filename(), att.contentType(), att.data().length, null));
        }
        dto.setAttachments(metas);
        dto.setHasAttachments(!metas.isEmpty());
        return new ParsedEmail(dto, attachments);
    }

    private void fillHeaders(Message msg, InboxEmailDTO dto) throws Exception {
        Address[] froms = msg.getFrom();
        if (froms != null && froms.length > 0 && froms[0] instanceof InternetAddress ia) {
            dto.setFromEmail(ia.getAddress() != null ? ia.getAddress() : "inconnu@unknown");
            dto.setFromName(ia.getPersonal() != null ? MimeUtility.decodeText(ia.getPersonal()) : ia.getAddress());
        } else if (froms != null && froms.length > 0) {
            dto.setFromEmail(froms[0].toString());
            dto.setFromName(froms[0].toString());
        } else {
            dto.setFromEmail("inconnu@unknown");
        }
        dto.setToEmails(formatAddresses(msg.getRecipients(Message.RecipientType.TO)));
        dto.setCcEmails(formatAddresses(msg.getRecipients(Message.RecipientType.CC)));
        dto.setSubject(msg.getSubject() != null ? MimeUtility.decodeText(msg.getSubject()) : "(Sans objet)");
        Date sent = msg.getSentDate() != null ? msg.getSentDate() : msg.getReceivedDate();
        if (sent != null) {
            dto.setSentAt(LocalDateTime.ofInstant(sent.toInstant(), ZoneId.systemDefault()));
        }
        String ct = msg.getContentType();
        dto.setHasAttachments(ct != null && ct.toLowerCase(Locale.ROOT).contains("multipart/mixed"));
    }

    private void extractParts(Part part, StringBuilder textBody, StringBuilder htmlBody, List<RawAttachment> attachments) throws Exception {
        if (part.isMimeType("text/plain") && !Part.ATTACHMENT.equalsIgnoreCase(part.getDisposition())) {
            Object content = part.getContent();
            if (content != null) textBody.append(content.toString()).append("\n");
        } else if (part.isMimeType("text/html") && !Part.ATTACHMENT.equalsIgnoreCase(part.getDisposition())) {
            Object content = part.getContent();
            if (content != null) htmlBody.append(content.toString()).append("\n");
        } else if (part.isMimeType("multipart/*")) {
            Multipart mp = (Multipart) part.getContent();
            for (int i = 0; i < mp.getCount(); i++) {
                extractParts(mp.getBodyPart(i), textBody, htmlBody, attachments);
            }
        } else if (Part.ATTACHMENT.equalsIgnoreCase(part.getDisposition())
                || (part.getFileName() != null && !part.getFileName().isBlank())) {
            String filename = part.getFileName() != null ? MimeUtility.decodeText(part.getFileName()) : "piece-jointe.bin";
            String ct = part.getContentType();
            if (ct != null && ct.contains(";")) ct = ct.substring(0, ct.indexOf(';')).trim();
            byte[] bytes = readAllBytes(part.getInputStream());
            attachments.add(new RawAttachment(filename, ct != null ? ct : "application/octet-stream", bytes));
        }
    }

    private byte[] readAllBytes(InputStream is) throws Exception {
        try (InputStream in = is; ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) != -1) {
                out.write(buf, 0, n);
            }
            return out.toByteArray();
        }
    }

    private String formatAddresses(Address[] addrs) {
        if (addrs == null || addrs.length == 0) return "";
        List<String> list = new ArrayList<>();
        for (Address a : addrs) {
            if (a instanceof InternetAddress ia) {
                list.add(ia.getAddress());
            } else {
                list.add(a.toString());
            }
        }
        return String.join(", ", list);
    }

    private void closeQuietly(Folder f) {
        if (f != null && f.isOpen()) {
            try { f.close(false); } catch (Exception ignored) {}
        }
    }

    private void closeQuietly(Store s) {
        if (s != null && s.isConnected()) {
            try { s.close(); } catch (Exception ignored) {}
        }
    }
}
