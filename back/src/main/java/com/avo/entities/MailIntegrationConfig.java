package com.avo.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Configuration globale (modifiable à chaud depuis Administration) du module optionnel
 * Messagerie & Calendrier externe (Microsoft 365 / Google Workspace).
 * Les secrets OAuth2 sont chiffrés en AES-256-GCM avant stockage.
 */
@Entity
@Table(name = "mail_integration_config")
@Getter
@Setter
@NoArgsConstructor
public class MailIntegrationConfig {

    @Id
    private Long id = 1L;

    @Column(nullable = false)
    private boolean enabled = false;

    @Column(name = "frontend_url", length = 500)
    private String frontendUrl;

    @Column(name = "microsoft_client_id")
    private String microsoftClientId;

    @Column(name = "microsoft_client_secret_enc", columnDefinition = "TEXT")
    private String microsoftClientSecretEnc;

    @Column(name = "microsoft_tenant_id", length = 120)
    private String microsoftTenantId;

    @Column(name = "microsoft_redirect_uri", length = 500)
    private String microsoftRedirectUri;

    @Column(name = "google_client_id")
    private String googleClientId;

    @Column(name = "google_client_secret_enc", columnDefinition = "TEXT")
    private String googleClientSecretEnc;

    @Column(name = "google_redirect_uri", length = 500)
    private String googleRedirectUri;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void touch() {
        updatedAt = LocalDateTime.now();
    }
}
