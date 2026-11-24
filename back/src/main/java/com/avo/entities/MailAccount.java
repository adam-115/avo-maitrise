package com.avo.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Compte de messagerie et calendrier connecté pour un utilisateur :
 * - MICROSOFT (OAuth2 Microsoft Graph : Mail.Read + Calendars.ReadWrite)
 * - GOOGLE (OAuth2 Google APIs : gmail.readonly + calendar.events)
 * - IMAP (lecture seule IMAP + export .ics pour calendrier)
 */
@Entity
@Table(name = "mail_accounts")
@Getter
@Setter
@NoArgsConstructor
public class MailAccount {

    public static final String PROVIDER_MICROSOFT = "MICROSOFT";
    public static final String PROVIDER_GOOGLE = "GOOGLE";
    public static final String PROVIDER_IMAP = "IMAP";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_username", nullable = false, length = 120)
    private String ownerUsername;

    @Column(nullable = false, length = 20)
    private String provider; // MICROSOFT, GOOGLE, IMAP

    @Column(name = "email_address", nullable = false)
    private String emailAddress;

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "imap_host")
    private String imapHost;

    @Column(name = "imap_port")
    private Integer imapPort = 993;

    @Column(name = "imap_ssl")
    private Boolean imapSsl = true;

    @Column(name = "imap_username")
    private String imapUsername;

    /** Mot de passe IMAP ou refresh_token OAuth2 chiffré AES-256-GCM. */
    @Column(name = "encrypted_secret", columnDefinition = "TEXT")
    private String encryptedSecret;

    /** Access token OAuth2 chiffré AES-256-GCM. */
    @Column(name = "encrypted_access_token", columnDefinition = "TEXT")
    private String encryptedAccessToken;

    @Column(name = "token_expires_at")
    private LocalDateTime tokenExpiresAt;

    @Column(name = "calendar_id")
    private String calendarId = "primary";

    @Column(name = "calendar_sync_enabled", nullable = false)
    private boolean calendarSyncEnabled = true;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "last_sync_at")
    private LocalDateTime lastSyncAt;

    @Column(name = "last_error", length = 500)
    private String lastError;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
        if (calendarId == null || calendarId.isBlank()) calendarId = "primary";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
