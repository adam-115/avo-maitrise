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
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Client Google Workspace APIs :
 * - Gmail : LECTURE SEULE (gmail.readonly) — aucune méthode d'envoi.
 * - Google Calendar : ÉCRITURE (calendar.events) — création / mise à jour / suppression d'événements.
 */
@Component
@Slf4j
public class GoogleWorkspaceClient {

    private static final String GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
    private static final String GCAL_BASE = "https://www.googleapis.com/calendar/v3/calendars";

    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();
    private final ObjectMapper objectMapper;

    public GoogleWorkspaceClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    // ==================== GMAIL (LECTURE SEULE) ====================

    public List<InboxEmailDTO> listInboxMessages(String accessToken, String searchQuery, int limit) {
        try {
            int max = Math.min(Math.max(limit, 1), 30);
            StringBuilder url = new StringBuilder(GMAIL_BASE)
                    .append("/messages?maxResults=").append(max);
            if (searchQuery != null && !searchQuery.isBlank()) {
                url.append("&q=").append(URLEncoder.encode(searchQuery.trim(), StandardCharsets.UTF_8));
            } else {
                url.append("&labelIds=INBOX");
            }
            JsonNode listNode = sendJson("GET", url.toString(), accessToken, null);
            List<InboxEmailDTO> result = new ArrayList<>();
            for (JsonNode ref : listNode.path("messages")) {
                String id = ref.path("id").asText();
                String metaUrl = GMAIL_BASE + "/messages/" + URLEncoder.encode(id, StandardCharsets.UTF_8)
                        + "?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Subject&metadataHeaders=Date";
                JsonNode detail = sendJson("GET", metaUrl, accessToken, null);
                result.add(mapGmailMessage(detail, false));
            }
            return result;
        } catch (Exception e) {
            throw new RuntimeException("Erreur lecture Gmail : " + e.getMessage(), e);
        }
    }

    public ImapReadOnlyClient.ParsedEmail getFullMessage(String accessToken, String messageId, boolean includeAttachments) {
        try {
            String url = GMAIL_BASE + "/messages/" + URLEncoder.encode(messageId, StandardCharsets.UTF_8) + "?format=full";
            JsonNode detail = sendJson("GET", url, accessToken, null);
            InboxEmailDTO dto = mapGmailMessage(detail, true);

            List<ImapReadOnlyClient.RawAttachment> rawAttachments = new ArrayList<>();
            if (includeAttachments && dto.getAttachments() != null) {
                for (InboxEmailDTO.AttachmentMeta meta : dto.getAttachments()) {
                    if (meta.getAttachmentId() == null || meta.getAttachmentId().isBlank()) continue;
                    String attUrl = GMAIL_BASE + "/messages/" + URLEncoder.encode(messageId, StandardCharsets.UTF_8)
                            + "/attachments/" + URLEncoder.encode(meta.getAttachmentId(), StandardCharsets.UTF_8);
                    JsonNode attNode = sendJson("GET", attUrl, accessToken, null);
                    String b64 = attNode.path("data").asText("");
                    if (!b64.isBlank()) {
                        byte[] bytes = Base64.getUrlDecoder().decode(b64);
                        rawAttachments.add(new ImapReadOnlyClient.RawAttachment(meta.getFilename(), meta.getContentType(), bytes));
                    }
                }
            }
            return new ImapReadOnlyClient.ParsedEmail(dto, rawAttachments);
        } catch (Exception e) {
            throw new RuntimeException("Erreur détail e-mail Gmail : " + e.getMessage(), e);
        }
    }

    // ==================== GOOGLE CALENDAR (ÉCRITURE) ====================

    public String upsertCalendarEvent(String accessToken,
                                      String calendarId,
                                      String existingEventId,
                                      String summary,
                                      String description,
                                      String location,
                                      LocalDateTime start,
                                      LocalDateTime end,
                                      boolean isAllDay,
                                      List<Integer> reminderMinutesList) {
        try {
            String calId = (calendarId == null || calendarId.isBlank()) ? "primary" : calendarId;
            ZoneId zone = ZoneId.systemDefault();

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("summary", summary);
            if (description != null) payload.put("description", description);
            if (location != null && !location.isBlank()) payload.put("location", location);

            if (isAllDay) {
                LocalDate sDate = start.toLocalDate();
                LocalDate eDate = (end != null && end.toLocalDate().isAfter(sDate)) ? end.toLocalDate() : sDate.plusDays(1);
                payload.put("start", Map.of("date", sDate.toString()));
                payload.put("end", Map.of("date", eDate.toString()));
            } else {
                LocalDateTime safeEnd = (end != null && end.isAfter(start)) ? end : start.plusHours(1);
                payload.put("start", Map.of("dateTime", start.atZone(zone).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME), "timeZone", zone.getId()));
                payload.put("end", Map.of("dateTime", safeEnd.atZone(zone).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME), "timeZone", zone.getId()));
            }

            if (reminderMinutesList != null && !reminderMinutesList.isEmpty()) {
                List<Map<String, Object>> overrides = new ArrayList<>();
                for (Integer mins : reminderMinutesList) {
                    if (mins != null && mins > 0) {
                        overrides.add(Map.of("method", "popup", "minutes", mins));
                    }
                }
                if (!overrides.isEmpty()) {
                    payload.put("reminders", Map.of("useDefault", false, "overrides", overrides));
                }
            }

            String json = objectMapper.writeValueAsString(payload);
            String base = GCAL_BASE + "/" + URLEncoder.encode(calId, StandardCharsets.UTF_8) + "/events";
            if (existingEventId != null && !existingEventId.isBlank()) {
                JsonNode res = sendJson("PATCH", base + "/" + URLEncoder.encode(existingEventId, StandardCharsets.UTF_8), accessToken, json);
                return res.path("id").asText(existingEventId);
            } else {
                JsonNode res = sendJson("POST", base, accessToken, json);
                return res.path("id").asText();
            }
        } catch (Exception e) {
            throw new RuntimeException("Erreur synchronisation Google Calendar : " + e.getMessage(), e);
        }
    }

    public void deleteCalendarEvent(String accessToken, String calendarId, String eventId) {
        if (eventId == null || eventId.isBlank()) return;
        try {
            String calId = (calendarId == null || calendarId.isBlank()) ? "primary" : calendarId;
            String url = GCAL_BASE + "/" + URLEncoder.encode(calId, StandardCharsets.UTF_8)
                    + "/events/" + URLEncoder.encode(eventId, StandardCharsets.UTF_8);
            HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Bearer " + accessToken)
                    .DELETE()
                    .build();
            httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        } catch (Exception e) {
            log.warn("Impossible de supprimer l'événement Google Calendar {}: {}", eventId, e.getMessage());
        }
    }

    private InboxEmailDTO mapGmailMessage(JsonNode node, boolean includeBody) {
        InboxEmailDTO dto = new InboxEmailDTO();
        dto.setProvider(MailAccount.PROVIDER_GOOGLE);
        dto.setExternalMessageId(node.path("id").asText());
        dto.setThreadId(node.path("threadId").asText(""));
        dto.setSnippet(node.path("snippet").asText(""));

        long internalDateMs = node.path("internalDate").asLong(0);
        if (internalDateMs > 0) {
            dto.setSentAt(LocalDateTime.ofInstant(Instant.ofEpochMilli(internalDateMs), ZoneId.systemDefault()));
        }

        JsonNode payload = node.path("payload");
        Map<String, String> headers = new HashMap<>();
        for (JsonNode h : payload.path("headers")) {
            headers.put(h.path("name").asText("").toLowerCase(Locale.ROOT), h.path("value").asText(""));
        }

        String fromRaw = headers.getOrDefault("from", "inconnu@unknown");
        parseFromHeader(fromRaw, dto);
        dto.setToEmails(headers.getOrDefault("to", ""));
        dto.setCcEmails(headers.getOrDefault("cc", ""));
        dto.setSubject(headers.getOrDefault("subject", "(Sans objet)"));

        if (includeBody) {
            StringBuilder text = new StringBuilder();
            StringBuilder html = new StringBuilder();
            List<InboxEmailDTO.AttachmentMeta> metas = new ArrayList<>();
            walkGmailParts(payload, text, html, metas);
            dto.setBodyText(text.toString().trim());
            dto.setBodyHtml(html.toString().trim());
            dto.setAttachments(metas);
            dto.setHasAttachments(!metas.isEmpty());
        }
        return dto;
    }

    private void walkGmailParts(JsonNode part, StringBuilder text, StringBuilder html, List<InboxEmailDTO.AttachmentMeta> metas) {
        String mimeType = part.path("mimeType").asText("");
        String filename = part.path("filename").asText("");
        JsonNode body = part.path("body");

        if (!filename.isBlank() && body.hasNonNull("attachmentId")) {
            metas.add(new InboxEmailDTO.AttachmentMeta(
                    body.get("attachmentId").asText(),
                    filename,
                    mimeType,
                    body.path("size").asLong(0),
                    null));
        } else if ("text/plain".equalsIgnoreCase(mimeType) && body.hasNonNull("data")) {
            text.append(new String(Base64.getUrlDecoder().decode(body.get("data").asText()), StandardCharsets.UTF_8)).append("\n");
        } else if ("text/html".equalsIgnoreCase(mimeType) && body.hasNonNull("data")) {
            html.append(new String(Base64.getUrlDecoder().decode(body.get("data").asText()), StandardCharsets.UTF_8)).append("\n");
        }

        for (JsonNode child : part.path("parts")) {
            walkGmailParts(child, text, html, metas);
        }
    }

    private void parseFromHeader(String raw, InboxEmailDTO dto) {
        int lt = raw.indexOf('<');
        int gt = raw.indexOf('>');
        if (lt >= 0 && gt > lt) {
            dto.setFromName(raw.substring(0, lt).replace("\"", "").trim());
            dto.setFromEmail(raw.substring(lt + 1, gt).trim());
        } else {
            dto.setFromEmail(raw.trim());
            dto.setFromName(raw.trim());
        }
    }

    private JsonNode sendJson(String method, String url, String accessToken, String body) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(20))
                .header("Authorization", "Bearer " + accessToken)
                .header("Accept", "application/json");
        if (body != null) {
            builder.header("Content-Type", "application/json");
            builder.method(method, HttpRequest.BodyPublishers.ofString(body));
        } else {
            builder.method(method, HttpRequest.BodyPublishers.noBody());
        }
        HttpResponse<String> resp = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() >= 400) {
            throw new IllegalStateException("Google API HTTP " + resp.statusCode() + " : " + resp.body());
        }
        if (resp.body() == null || resp.body().isBlank()) return objectMapper.createObjectNode();
        return objectMapper.readTree(resp.body());
    }
}
