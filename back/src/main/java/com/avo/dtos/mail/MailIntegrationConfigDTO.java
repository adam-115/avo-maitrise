package com.avo.dtos.mail;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class MailIntegrationConfigDTO {
    private boolean enabled;
    private String frontendUrl;

    // Microsoft 365 / Outlook
    private String microsoftClientId;
    /** Écriture uniquement — jamais renvoyé en clair par l'API. */
    private String microsoftClientSecret;
    private boolean hasMicrosoftClientSecret;
    private boolean clearMicrosoftSecret;
    private String microsoftTenantId;
    private String microsoftRedirectUri;
    private boolean microsoftConfigured;

    // Google Workspace / Gmail
    private String googleClientId;
    /** Écriture uniquement — jamais renvoyé en clair par l'API. */
    private String googleClientSecret;
    private boolean hasGoogleClientSecret;
    private boolean clearGoogleSecret;
    private String googleRedirectUri;
    private boolean googleConfigured;

    private LocalDateTime updatedAt;
}
