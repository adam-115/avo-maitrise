package com.avo.dtos.mail;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class MailAccountDTO {
    private Long id;
    private String ownerUsername;
    private String provider; // MICROSOFT, GOOGLE, IMAP
    private String emailAddress;
    private String displayName;
    private String imapHost;
    private Integer imapPort;
    private Boolean imapSsl;
    private String imapUsername;
    /** Utilisé uniquement en écriture lors de la connexion IMAP — jamais renvoyé par l'API. */
    private String imapPassword;
    private String calendarId;
    private boolean calendarSyncEnabled;
    private boolean active;
    private boolean supportsCalendarWrite;
    private LocalDateTime lastSyncAt;
    private String lastError;
    private LocalDateTime createdAt;
}
