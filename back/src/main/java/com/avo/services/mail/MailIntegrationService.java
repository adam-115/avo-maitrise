package com.avo.services.mail;

import com.avo.dtos.DocumentDTO;
import com.avo.dtos.mail.DossierEmailDTO;
import com.avo.dtos.mail.FileEmailRequest;
import com.avo.dtos.mail.InboxEmailDTO;
import com.avo.dtos.mail.MailAccountDTO;
import com.avo.entities.DossierEmail;
import com.avo.entities.MailAccount;
import com.avo.events.MatterActionEvent;
import com.avo.repositories.DossierEmailRepository;
import com.avo.repositories.MailAccountRepository;
import com.avo.services.DocumentService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Orchestrateur de la messagerie connectée (lecture seule) et du classement en 1 clic dans les dossiers.
 */
@Service
@Slf4j
public class MailIntegrationService {

    private final MailAccountRepository accountRepository;
    private final DossierEmailRepository dossierEmailRepository;
    private final MailCredentialCrypto crypto;
    private final MailOAuth2Service oauth2Service;
    private final ImapReadOnlyClient imapClient;
    private final MicrosoftGraphClient microsoftClient;
    private final GoogleWorkspaceClient googleClient;
    private final EmailDossierSuggestionService suggestionService;
    private final DocumentService documentService;
    private final ApplicationEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;

    public MailIntegrationService(MailAccountRepository accountRepository,
                                  DossierEmailRepository dossierEmailRepository,
                                  MailCredentialCrypto crypto,
                                  MailOAuth2Service oauth2Service,
                                  ImapReadOnlyClient imapClient,
                                  MicrosoftGraphClient microsoftClient,
                                  GoogleWorkspaceClient googleClient,
                                  EmailDossierSuggestionService suggestionService,
                                  DocumentService documentService,
                                  ApplicationEventPublisher eventPublisher,
                                  ObjectMapper objectMapper) {
        this.accountRepository = accountRepository;
        this.dossierEmailRepository = dossierEmailRepository;
        this.crypto = crypto;
        this.oauth2Service = oauth2Service;
        this.imapClient = imapClient;
        this.microsoftClient = microsoftClient;
        this.googleClient = googleClient;
        this.suggestionService = suggestionService;
        this.documentService = documentService;
        this.eventPublisher = eventPublisher;
        this.objectMapper = objectMapper;
    }

    public String getCurrentUsername() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
                return auth.getName();
            }
        } catch (Exception ignored) {}
        return "dev-user";
    }

    // ==================== COMPTES CONNECTÉS ====================

    public List<MailAccountDTO> listMyAccounts() {
        String user = getCurrentUsername();
        List<MailAccount> accounts = accountRepository.findByOwnerUsernameAndActiveTrueOrderByCreatedAtDesc(user);
        if (accounts.isEmpty() && "dev-user".equals(user)) {
            accounts = accountRepository.findByActiveTrueOrderByCreatedAtDesc();
        }
        return accounts.stream().map(this::toAccountDto).toList();
    }

    @Transactional
    public MailAccountDTO connectImapAccount(MailAccountDTO req) {
        if (req.getEmailAddress() == null || req.getEmailAddress().isBlank()) {
            throw new IllegalArgumentException("L'adresse e-mail est obligatoire.");
        }
        if (req.getImapHost() == null || req.getImapHost().isBlank()) {
            throw new IllegalArgumentException("Le serveur IMAP est obligatoire (ex. imap.gmail.com, outlook.office365.com).");
        }
        if (req.getImapPassword() == null || req.getImapPassword().isBlank()) {
            throw new IllegalArgumentException("Le mot de passe (ou mot de passe d'application) IMAP est obligatoire.");
        }
        int port = req.getImapPort() != null ? req.getImapPort() : 993;
        boolean ssl = req.getImapSsl() == null || req.getImapSsl();
        String imapUser = (req.getImapUsername() != null && !req.getImapUsername().isBlank())
                ? req.getImapUsername().trim() : req.getEmailAddress().trim();

        // Vérification réelle en mode lecture seule avant d'enregistrer
        imapClient.testConnection(req.getImapHost().trim(), port, ssl, imapUser, req.getImapPassword());

        String owner = getCurrentUsername();
        MailAccount account = accountRepository
                .findByOwnerUsernameAndProviderAndEmailAddressIgnoreCase(owner, MailAccount.PROVIDER_IMAP, req.getEmailAddress().trim())
                .orElseGet(MailAccount::new);
        account.setOwnerUsername(owner);
        account.setProvider(MailAccount.PROVIDER_IMAP);
        account.setEmailAddress(req.getEmailAddress().trim());
        account.setDisplayName(req.getDisplayName() != null && !req.getDisplayName().isBlank()
                ? req.getDisplayName().trim() : req.getEmailAddress().trim());
        account.setImapHost(req.getImapHost().trim());
        account.setImapPort(port);
        account.setImapSsl(ssl);
        account.setImapUsername(imapUser);
        account.setEncryptedSecret(crypto.encrypt(req.getImapPassword()));
        account.setCalendarSyncEnabled(false); // IMAP ne permet pas l'écriture calendrier API (export .ics disponible)
        account.setActive(true);
        account.setLastSyncAt(LocalDateTime.now());
        account.setLastError(null);
        return toAccountDto(accountRepository.save(account));
    }

    @Transactional
    public MailAccountDTO updateCalendarSync(Long accountId, boolean enabled) {
        MailAccount account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Compte introuvable : " + accountId));
        account.setCalendarSyncEnabled(enabled);
        return toAccountDto(accountRepository.save(account));
    }

    @Transactional
    public void deleteAccount(Long accountId) {
        accountRepository.deleteById(accountId);
    }

    // ==================== BOÎTE DE RÉCEPTION (LECTURE SEULE) ====================

    public List<InboxEmailDTO> listInbox(Long accountId, String query, int limit) {
        MailAccount account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Compte mail introuvable : " + accountId));
        int safeLimit = Math.min(Math.max(limit, 5), 50);

        List<InboxEmailDTO> messages;
        try {
            if (MailAccount.PROVIDER_MICROSOFT.equalsIgnoreCase(account.getProvider())) {
                String token = oauth2Service.getValidAccessToken(account);
                messages = microsoftClient.listInboxMessages(token, query, safeLimit);
            } else if (MailAccount.PROVIDER_GOOGLE.equalsIgnoreCase(account.getProvider())) {
                String token = oauth2Service.getValidAccessToken(account);
                messages = googleClient.listInboxMessages(token, query, safeLimit);
            } else if (MailAccount.PROVIDER_IMAP.equalsIgnoreCase(account.getProvider())) {
                String pwd = crypto.decrypt(account.getEncryptedSecret());
                messages = imapClient.listMessages(account, pwd, query, safeLimit);
            } else {
                throw new IllegalArgumentException("Fournisseur non supporté : " + account.getProvider());
            }
            account.setLastSyncAt(LocalDateTime.now());
            account.setLastError(null);
            accountRepository.save(account);
        } catch (Exception e) {
            account.setLastError(truncate(e.getMessage(), 480));
            accountRepository.save(account);
            throw e;
        }

        // Marquer les e-mails déjà classés dans un ou plusieurs dossiers
        List<String> extIds = messages.stream()
                .map(InboxEmailDTO::getExternalMessageId)
                .filter(Objects::nonNull)
                .toList();
        if (!extIds.isEmpty()) {
            Map<String, List<Long>> filedMap = dossierEmailRepository.findByExternalMessageIdIn(extIds).stream()
                    .collect(Collectors.groupingBy(
                            DossierEmail::getExternalMessageId,
                            Collectors.mapping(DossierEmail::getDossierId, Collectors.toList())));
            for (InboxEmailDTO m : messages) {
                List<Long> ids = filedMap.get(m.getExternalMessageId());
                if (ids != null) m.setFiledDossierIds(ids);
            }
        }

        // Suggestions automatiques de dossiers
        suggestionService.enrichSuggestions(messages);
        return messages;
    }

    public InboxEmailDTO getMessageDetail(Long accountId, String externalMessageId) {
        MailAccount account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Compte mail introuvable : " + accountId));

        ImapReadOnlyClient.ParsedEmail parsed = fetchFullMessage(account, externalMessageId, false);
        InboxEmailDTO dto = parsed.dto();
        List<DossierEmail> existing = dossierEmailRepository.findByExternalMessageIdIn(List.of(externalMessageId));
        dto.setFiledDossierIds(existing.stream().map(DossierEmail::getDossierId).distinct().toList());
        suggestionService.enrichSuggestions(List.of(dto));
        return dto;
    }

    // ==================== CLASSEMENT EN 1 CLIC DANS UN DOSSIER ====================

    @Transactional
    public DossierEmailDTO fileEmailToDossier(FileEmailRequest req) {
        if (req.getDossierId() == null) {
            throw new IllegalArgumentException("L'identifiant du dossier est obligatoire.");
        }
        MailAccount account = accountRepository.findById(req.getAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Compte mail introuvable : " + req.getAccountId()));

        // Anti-doublon : si déjà classé dans ce dossier, retourner l'existant
        Optional<DossierEmail> dup = dossierEmailRepository
                .findByDossierIdAndExternalMessageId(req.getDossierId(), req.getExternalMessageId());
        if (dup.isPresent()) {
            return toDossierEmailDto(dup.get());
        }

        ImapReadOnlyClient.ParsedEmail parsed = fetchFullMessage(account, req.getExternalMessageId(), req.isImportAttachments());
        return persistParsedEmail(req.getDossierId(), account.getId(), parsed, req.isImportAttachments());
    }

    @Transactional
    public DossierEmailDTO importEmlToDossier(Long dossierId, MultipartFile file, boolean importAttachments) {
        if (dossierId == null) throw new IllegalArgumentException("dossierId requis");
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Fichier .eml vide");
        try {
            ImapReadOnlyClient.ParsedEmail parsed = imapClient.parseEmlBytes(file.getBytes());
            Optional<DossierEmail> dup = dossierEmailRepository
                    .findByDossierIdAndExternalMessageId(dossierId, parsed.dto().getExternalMessageId());
            if (dup.isPresent()) {
                return toDossierEmailDto(dup.get());
            }
            return persistParsedEmail(dossierId, null, parsed, importAttachments);
        } catch (Exception e) {
            throw new RuntimeException("Erreur import .eml : " + e.getMessage(), e);
        }
    }

    public List<DossierEmailDTO> listDossierEmails(Long dossierId) {
        return dossierEmailRepository.findByDossierIdOrderBySentAtDescFiledAtDesc(dossierId).stream()
                .map(this::toDossierEmailDto)
                .toList();
    }

    @Transactional
    public void deleteDossierEmail(Long emailId) {
        dossierEmailRepository.findById(emailId).ifPresent(email -> {
            dossierEmailRepository.delete(email);
            eventPublisher.publishEvent(new MatterActionEvent(
                    this, email.getDossierId(), getCurrentUsername(),
                    "Suppression", "E-mail", email.getId(),
                    "E-mail retiré du dossier : " + email.getSubject()));
        });
    }

    private ImapReadOnlyClient.ParsedEmail fetchFullMessage(MailAccount account, String externalMessageId, boolean includeAttachments) {
        if (MailAccount.PROVIDER_MICROSOFT.equalsIgnoreCase(account.getProvider())) {
            String token = oauth2Service.getValidAccessToken(account);
            return microsoftClient.getFullMessage(token, externalMessageId, includeAttachments);
        } else if (MailAccount.PROVIDER_GOOGLE.equalsIgnoreCase(account.getProvider())) {
            String token = oauth2Service.getValidAccessToken(account);
            return googleClient.getFullMessage(token, externalMessageId, includeAttachments);
        } else if (MailAccount.PROVIDER_IMAP.equalsIgnoreCase(account.getProvider())) {
            String pwd = crypto.decrypt(account.getEncryptedSecret());
            return imapClient.getFullMessage(account, pwd, externalMessageId);
        }
        throw new IllegalArgumentException("Fournisseur non supporté : " + account.getProvider());
    }

    private DossierEmailDTO persistParsedEmail(Long dossierId, Long mailAccountId,
                                               ImapReadOnlyClient.ParsedEmail parsed, boolean importAttachments) {
        InboxEmailDTO src = parsed.dto();
        List<InboxEmailDTO.AttachmentMeta> savedAttachments = new ArrayList<>();

        // Sauvegarde automatique des pièces jointes dans la GED (MinIO + indexation RAG Qdrant via DocumentService)
        if (importAttachments && parsed.attachments() != null && !parsed.attachments().isEmpty()) {
            for (ImapReadOnlyClient.RawAttachment raw : parsed.attachments()) {
                try {
                    DocumentDTO docDto = new DocumentDTO();
                    docDto.setDossierId(dossierId);
                    docDto.setNomFichier(raw.filename());
                    docDto.setDescription("Pièce jointe e-mail : " + truncate(src.getSubject(), 180));
                    docDto.setFileData(Base64.getEncoder().encodeToString(raw.data()));
                    DocumentDTO created = documentService.create(docDto);
                    savedAttachments.add(new InboxEmailDTO.AttachmentMeta(
                            null, raw.filename(), raw.contentType(), raw.data().length, created.getId()));
                } catch (Exception e) {
                    log.warn("Impossible d'enregistrer la pièce jointe {} en GED : {}", raw.filename(), e.getMessage());
                    savedAttachments.add(new InboxEmailDTO.AttachmentMeta(
                            null, raw.filename(), raw.contentType(), raw.data().length, null));
                }
            }
        } else if (src.getAttachments() != null) {
            savedAttachments.addAll(src.getAttachments());
        }

        DossierEmail entity = new DossierEmail();
        entity.setDossierId(dossierId);
        entity.setMailAccountId(mailAccountId);
        entity.setProvider(src.getProvider());
        entity.setExternalMessageId(src.getExternalMessageId());
        entity.setThreadId(src.getThreadId());
        entity.setFromName(truncate(src.getFromName(), 250));
        entity.setFromEmail(truncate(src.getFromEmail() != null ? src.getFromEmail() : "inconnu@unknown", 250));
        entity.setToEmails(src.getToEmails());
        entity.setCcEmails(src.getCcEmails());
        entity.setSubject(truncate(src.getSubject(), 490));
        entity.setSnippet(truncate(src.getSnippet(), 980));
        entity.setBodyText(src.getBodyText());
        entity.setBodyHtml(src.getBodyHtml());
        entity.setSentAt(src.getSentAt() != null ? src.getSentAt() : LocalDateTime.now());
        entity.setFiledAt(LocalDateTime.now());
        entity.setFiledBy(getCurrentUsername());
        entity.setDirection("INBOUND");
        entity.setHasAttachments(!savedAttachments.isEmpty());
        try {
            entity.setAttachmentsJson(objectMapper.writeValueAsString(savedAttachments));
        } catch (Exception e) {
            entity.setAttachmentsJson("[]");
        }

        DossierEmail saved = dossierEmailRepository.save(entity);

        String pjInfo = savedAttachments.isEmpty() ? "" : " (" + savedAttachments.size() + " PJ vers GED)";
        eventPublisher.publishEvent(new MatterActionEvent(
                this, dossierId, getCurrentUsername(),
                "Classement", "E-mail", saved.getId(),
                "E-mail classé : " + saved.getSubject() + pjInfo));

        return toDossierEmailDto(saved);
    }

    public MailAccountDTO toAccountDto(MailAccount a) {
        MailAccountDTO dto = new MailAccountDTO();
        dto.setId(a.getId());
        dto.setOwnerUsername(a.getOwnerUsername());
        dto.setProvider(a.getProvider());
        dto.setEmailAddress(a.getEmailAddress());
        dto.setDisplayName(a.getDisplayName());
        dto.setImapHost(a.getImapHost());
        dto.setImapPort(a.getImapPort());
        dto.setImapSsl(a.getImapSsl());
        dto.setImapUsername(a.getImapUsername());
        dto.setCalendarId(a.getCalendarId());
        dto.setCalendarSyncEnabled(a.isCalendarSyncEnabled());
        dto.setActive(a.isActive());
        dto.setSupportsCalendarWrite(
                MailAccount.PROVIDER_MICROSOFT.equalsIgnoreCase(a.getProvider())
                        || MailAccount.PROVIDER_GOOGLE.equalsIgnoreCase(a.getProvider()));
        dto.setLastSyncAt(a.getLastSyncAt());
        dto.setLastError(a.getLastError());
        dto.setCreatedAt(a.getCreatedAt());
        return dto;
    }

    private DossierEmailDTO toDossierEmailDto(DossierEmail e) {
        DossierEmailDTO dto = new DossierEmailDTO();
        dto.setId(e.getId());
        dto.setDossierId(e.getDossierId());
        dto.setMailAccountId(e.getMailAccountId());
        dto.setProvider(e.getProvider());
        dto.setExternalMessageId(e.getExternalMessageId());
        dto.setThreadId(e.getThreadId());
        dto.setFromName(e.getFromName());
        dto.setFromEmail(e.getFromEmail());
        dto.setToEmails(e.getToEmails());
        dto.setCcEmails(e.getCcEmails());
        dto.setSubject(e.getSubject());
        dto.setSnippet(e.getSnippet());
        dto.setBodyText(e.getBodyText());
        dto.setBodyHtml(e.getBodyHtml());
        dto.setSentAt(e.getSentAt());
        dto.setFiledAt(e.getFiledAt());
        dto.setFiledBy(e.getFiledBy());
        dto.setDirection(e.getDirection());
        dto.setHasAttachments(e.isHasAttachments());
        if (e.getAttachmentsJson() != null && !e.getAttachmentsJson().isBlank()) {
            try {
                dto.setAttachments(objectMapper.readValue(e.getAttachmentsJson(), new TypeReference<>() {}));
            } catch (Exception ignored) {}
        }
        return dto;
    }

    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
