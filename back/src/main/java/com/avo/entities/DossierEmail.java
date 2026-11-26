package com.avo.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.time.LocalDateTime;

/**
 * E-mail classé dans un dossier (depuis Outlook, Gmail, IMAP ou import .eml).
 * Entité auditée (Hibernate Envers) pour la traçabilité des correspondances.
 */
@Audited
@Entity
@Table(name = "dossier_emails")
@Getter
@Setter
@NoArgsConstructor
public class DossierEmail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dossier_id", nullable = false)
    private Long dossierId;

    @Column(name = "mail_account_id")
    private Long mailAccountId;

    @Column(length = 20)
    private String provider; // MICROSOFT, GOOGLE, IMAP, EML_UPLOAD

    @Column(name = "external_message_id")
    private String externalMessageId;

    @Column(name = "thread_id")
    private String threadId;

    @Column(name = "from_name")
    private String fromName;

    @Column(name = "from_email", nullable = false)
    private String fromEmail;

    @Column(name = "to_emails", columnDefinition = "TEXT")
    private String toEmails;

    @Column(name = "cc_emails", columnDefinition = "TEXT")
    private String ccEmails;

    @Column(length = 500)
    private String subject;

    @Column(length = 1000)
    private String snippet;

    @Column(name = "body_text", columnDefinition = "LONGTEXT")
    private String bodyText;

    @Column(name = "body_html", columnDefinition = "LONGTEXT")
    private String bodyHtml;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "filed_at", nullable = false)
    private LocalDateTime filedAt;

    @Column(name = "filed_by", length = 120)
    private String filedBy;

    @Column(length = 20)
    private String direction = "INBOUND";

    @Column(name = "attachments_json", columnDefinition = "TEXT")
    private String attachmentsJson;

    @Column(name = "has_attachments", nullable = false)
    private boolean hasAttachments = false;

    @PrePersist
    protected void onCreate() {
        if (filedAt == null) filedAt = LocalDateTime.now();
        if (direction == null || direction.isBlank()) direction = "INBOUND";
    }
}
