package com.avo.dtos.mail;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class DossierEmailDTO {
    private Long id;
    private Long dossierId;
    private Long mailAccountId;
    private String provider;
    private String externalMessageId;
    private String threadId;
    private String fromName;
    private String fromEmail;
    private String toEmails;
    private String ccEmails;
    private String subject;
    private String snippet;
    private String bodyText;
    private String bodyHtml;
    private LocalDateTime sentAt;
    private LocalDateTime filedAt;
    private String filedBy;
    private String direction;
    private boolean hasAttachments;
    private List<InboxEmailDTO.AttachmentMeta> attachments = new ArrayList<>();
}
