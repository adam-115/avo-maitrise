package com.avo.dtos.mail;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class InboxEmailDTO {
    private String externalMessageId;
    private String threadId;
    private String provider;
    private String fromName;
    private String fromEmail;
    private String toEmails;
    private String ccEmails;
    private String subject;
    private String snippet;
    private String bodyText;
    private String bodyHtml;
    private LocalDateTime sentAt;
    private boolean hasAttachments;
    private List<AttachmentMeta> attachments = new ArrayList<>();

    // Enrichissement Avo-Maîtrise
    private List<Long> filedDossierIds = new ArrayList<>();
    private Long suggestedDossierId;
    private String suggestedDossierReference;
    private String suggestedDossierTitre;
    private String suggestionReason;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttachmentMeta {
        private String attachmentId;
        private String filename;
        private String contentType;
        private long size;
        private Long documentId;
    }
}
