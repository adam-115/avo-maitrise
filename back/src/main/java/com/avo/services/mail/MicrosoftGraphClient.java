package com.avo.services.mail;

import com.avo.dtos.mail.InboxEmailDTO;
import com.avo.entities.MailAccount;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Client Microsoft Graph API :
 * - E-mail : LECTURE SEULE (Mail.Read) — aucune méthode d'envoi.
 * - Calendrier : ÉCRITURE (Calendars.ReadWrite) — création / mise à jour / suppression d'événements.
 */
@Component
@Slf4j
public class MicrosoftGraphClient {

    private static final String GRAPH_BASE = "https://graph.microsoft.com/v1.0";
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();
    private final ObjectMapper objectMapper;

    public MicrosoftGraphClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    // ==================== MAIL (LECTURE SEULE) ====================

    public List<InboxEmailDTO> listInboxMessages(String accessToken, String searchQuery, int limit) {
        try {
            int top = Math.min(Math.max(limit, 1), 50);
            StringBuilder url = new StringBuilder(GRAPH_BASE)
                    .append("/me/messages?$top=").append(top)
                    .append("&$select=id,conversationId,subject,bodyPreview,from,toRecipients,ccRecipients,receivedDateTime,hasAttachments");
            if (searchQuery != null && !searchQuery.isBlank()) {
                url.append("&$search=").append(URLEncoder.encode("\"" + searchQuery.trim() + "\"", StandardCharsets.UTF_8));
            } else {
                url.append("&$orderby=receivedDateTime%20DESC");
            }

            JsonNode root = sendJson("GET", url.toString(), accessToken, null,
                    searchQuery != null && !searchQuery.isBlank() ? Map.of("ConsistencyLevel", "eventual") : Map.of());
            List<InboxEmailDTO> list = new ArrayList<>();
            for (JsonNode item : root.path("value")) {
                list.add(mapGraphMessage(item, false));
            }
            return list;
        } catch (Exception e) {
            throw new RuntimeException("Erreur lecture Outlook (Graph API) : " + e.getMessage(), e);
        }
    }

    public ImapReadOnlyClient.ParsedEmail getFullMessage(String accessToken, String messageId, boolean includeAttachments) {
        try {
            String url = GRAPH_BASE + "/me/messages/" + URLEncoder.encode(messageId, StandardCharsets.UTF_8)
                    + "?$select=id,conversationId,subject,bodyPreview,body,from,toRecipients,ccRecipients,receivedDateTime,hasAttachments";
            JsonNode msgNode = sendJson("GET", url, accessToken, null, Map.of());
            InboxEmailDTO dto = mapGraphMessage(msgNode, true);

            List<ImapReadOnlyClient.RawAttachment> rawAttachments = new ArrayList<>();
            if (dto.isHasAttachments()) {
                String attUrl = GRAPH_BASE + "/me/messages/" + URLEncoder.encode(messageId, StandardCharsets.UTF_8) + "/attachments";
                JsonNode attRoot = sendJson("GET", attUrl, accessToken, null, Map.of());
                List<InboxEmailDTO.AttachmentMeta> metas = new ArrayList<>();
                for (JsonNode att : attRoot.path("value")) {
                    if (att.path("isInline").asBoolean(false)) continue;
                    String attId = att.path("id").asText();
                    String name = att.path("name").asText("piece-jointe");
                    String ct = att.path("contentType").asText("application/octet-stream");
                    long size = att.path("size").asLong(0);
                    metas.add(new InboxEmailDTO.AttachmentMeta(attId, name, ct, size, null));
                    if (includeAttachments && att.hasNonNull("contentBytes")) {
                        byte[] data = Base64.getDecoder().decode(att.get("contentBytes").asText());
                        rawAttachments.add(new ImapReadOnlyClient.RawAttachment(name, ct, data));
                    }
                }
                dto.setAttachments(metas);
            }
            return new ImapReadOnlyClient.ParsedEmail(dto, rawAttachments);
        } catch (Exception e) {
            throw new RuntimeException("Erreur détail e-mail Outlook : " + e.getMessage(), e);
        }
    }

    // ==================== CALENDRIER (ÉCRITURE) ====================

    public String upsertCalendarEvent(String accessToken,
                                      String existingEventId,
                                      String subject,
                                      String description,
                                      String location,
                                      LocalDateTime start,
                                      LocalDateTime end,
                                      boolean isAllDay,
                                      Integer reminderMinutes) {
        try {
            String tz = ZoneId.systemDefault().getId();
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("subject", subject);
            payload.put("body", Map.of("contentType", "Text", "content", description != null ? description : ""));
            if (location != null && !location.isBlank()) {
                payload.put("location", Map.of("displayName", location));
            }
            payload.put("isAllDay", isAllDay);
            if (isAllDay) {
                LocalDate startDate = start.toLocalDate();
                LocalDate endDate = end != null && end.toLocalDate().isAfter(startDate)
                        ? end.toLocalDate() : startDate.plusDays(1);
                payload.put("start", Map.of("dateTime", startDate + "T00:00:00", "timeZone", tz));
                payload.put("end", Map.of("dateTime", endDate + "T00:00:00", "timeZone", tz));
            } else {
                LocalDateTime safeEnd = (end != null && end.isAfter(start)) ? end : start.plusHours(1);
                payload.put("start", Map.of("dateTime", start.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME), "timeZone", tz));
                payload.put("end", Map.of("dateTime", safeEnd.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME), "timeZone", tz));
            }
            if (reminderMinutes != null && reminderMinutes > 0) {
                payload.put("isReminderOn", true);
                payload.put("reminderMinutesBeforeStart", reminderMinutes);
            }

            String json = objectMapper.writeValueAsString(payload);
            if (existingEventId != null && !existingEventId.isBlank()) {
                String url = GRAPH_BASE + "/me/events/" + URLEncoder.encode(existingEventId, StandardCharsets.UTF_8);
                JsonNode res = sendJson("PATCH", url, accessToken, json, Map.of());
                return res.path("id").asText(existingEventId);
            } else {
                JsonNode res = sendJson("POST", GRAPH_BASE + "/me/events", accessToken, json, Map.of());
                return res.path("id").asText();
            }
        } catch (Exception e) {
            throw new RuntimeException("Erreur synchronisation calendrier Outlook : " + e.getMessage(), e);
        }
    }

    public void deleteCalendarEvent(String accessToken, String eventId) {
        if (eventId == null || eventId.isBlank()) return;
        try {
            String url = GRAPH_BASE + "/me/events/" + URLEncoder.encode(eventId, StandardCharsets.UTF_8);
            HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Bearer " + accessToken)
                    .DELETE()
                    .build();
            httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        } catch (Exception e) {
            log.warn("Impossible de supprimer l'événement Outlook {}: {}", eventId, e.getMessage());
        }
    }

    private InboxEmailDTO mapGraphMessage(JsonNode node, boolean includeBody) {
        InboxEmailDTO dto = new InboxEmailDTO();
        dto.setProvider(MailAccount.PROVIDER_MICROSOFT);
        dto.setExternalMessageId(node.path("id").asText());
        dto.setThreadId(node.path("conversationId").asText(""));
        dto.setSubject(node.path("subject").asText("(Sans objet)"));
        dto.setSnippet(node.path("bodyPreview").asText(""));
        dto.setHasAttachments(node.path("hasAttachments").asBoolean(false));

        JsonNode fromAddr = node.path("from").path("emailAddress");
        dto.setFromEmail(fromAddr.path("address").asText("inconnu@unknown"));
        dto.setFromName(fromAddr.path("name").asText(dto.getFromEmail()));
        dto.setToEmails(joinGraphRecipients(node.path("toRecipients")));
        dto.setCcEmails(joinGraphRecipients(node.path("ccRecipients")));

        String received = node.path("receivedDateTime").asText("");
        if (!received.isBlank()) {
            try {
                dto.setSentAt(OffsetDateTime.parse(received).atZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime());
            } catch (Exception ignored) {}
        }

        if (includeBody) {
            JsonNode body = node.path("body");
            String contentType = body.path("contentType").asText("text");
            String content = body.path("content").asText("");
            if ("html".equalsIgnoreCase(contentType)) {
                dto.setBodyHtml(content);
                dto.setBodyText(content.replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim());
            } else {
                dto.setBodyText(content);
            }
        }
        return dto;
    }

    private String joinGraphRecipients(JsonNode arr) {
        if (arr == null || !arr.isArray()) return "";
        List<String> list = new ArrayList<>();
        for (JsonNode r : arr) {
            String addr = r.path("emailAddress").path("address").asText("");
            if (!addr.isBlank()) list.add(addr);
        }
        return String.join(", ", list);
    }

    private JsonNode sendJson(String method, String url, String accessToken, String body, Map<String, String> extraHeaders) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(20))
                .header("Authorization", "Bearer " + accessToken)
                .header("Accept", "application/json");
        extraHeaders.forEach(builder::header);
        if (body != null) {
            builder.header("Content-Type", "application/json");
            builder.method(method, HttpRequest.BodyPublishers.ofString(body));
        } else {
            builder.method(method, HttpRequest.BodyPublishers.noBody());
        }
        HttpResponse<String> resp = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() >= 400) {
            throw new IllegalStateException("Microsoft Graph HTTP " + resp.statusCode() + " : " + resp.body());
        }
        if (resp.body() == null || resp.body().isBlank()) return objectMapper.createObjectNode();
        return objectMapper.readTree(resp.body());
    }
}
