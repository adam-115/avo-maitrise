package com.avo.services.mail;

import com.avo.dtos.mail.MailIntegrationConfigDTO;
import com.avo.entities.MailIntegrationConfig;
import com.avo.repositories.MailIntegrationConfigRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Gère la configuration à chaud (en base de données, avec fallback sur application.properties)
 * du module optionnel Messagerie & Calendrier.
 * Les secrets OAuth2 sont stockés chiffrés en AES-256-GCM.
 */
@Service
public class MailIntegrationConfigService {

    private final MailIntegrationConfigRepository repository;
    private final MailCredentialCrypto crypto;

    @Value("${mail.integration.enabled:false}")
    private boolean defaultEnabled;
    @Value("${mail.integration.frontend-url:http://localhost:8080}")
    private String defaultFrontendUrl;

    @Value("${mail.integration.oauth.microsoft.client-id:}")
    private String defaultMsClientId;
    @Value("${mail.integration.oauth.microsoft.client-secret:}")
    private String defaultMsClientSecret;
    @Value("${mail.integration.oauth.microsoft.tenant-id:common}")
    private String defaultMsTenantId;
    @Value("${mail.integration.oauth.microsoft.redirect-uri:http://localhost:8080/api/mail-integration/oauth/microsoft/callback}")
    private String defaultMsRedirectUri;

    @Value("${mail.integration.oauth.google.client-id:}")
    private String defaultGoogleClientId;
    @Value("${mail.integration.oauth.google.client-secret:}")
    private String defaultGoogleClientSecret;
    @Value("${mail.integration.oauth.google.redirect-uri:http://localhost:8080/api/mail-integration/oauth/google/callback}")
    private String defaultGoogleRedirectUri;

    private volatile MailIntegrationConfig cachedConfig;

    public MailIntegrationConfigService(MailIntegrationConfigRepository repository,
                                        MailCredentialCrypto crypto) {
        this.repository = repository;
        this.crypto = crypto;
    }

    private MailIntegrationConfig getEntity() {
        MailIntegrationConfig cfg = cachedConfig;
        if (cfg != null) return cfg;
        cfg = repository.findById(1L).orElseGet(() -> {
            MailIntegrationConfig fresh = new MailIntegrationConfig();
            fresh.setId(1L);
            fresh.setEnabled(defaultEnabled);
            return fresh;
        });
        cachedConfig = cfg;
        return cfg;
    }

    public boolean isEnabled() {
        return getEntity().isEnabled();
    }

    @Transactional
    public boolean setEnabled(boolean enabled) {
        MailIntegrationConfig cfg = repository.findById(1L).orElseGet(MailIntegrationConfig::new);
        cfg.setId(1L);
        cfg.setEnabled(enabled);
        cachedConfig = repository.save(cfg);
        return enabled;
    }

    // ==================== ACCESSEURS DYNAMIQUES (DB -> FALLBACK PROPERTIES) ====================

    public String getFrontendUrl() {
        return pick(getEntity().getFrontendUrl(), defaultFrontendUrl);
    }

    public String getMicrosoftClientId() {
        return pick(getEntity().getMicrosoftClientId(), defaultMsClientId);
    }

    public String getMicrosoftClientSecret() {
        String enc = getEntity().getMicrosoftClientSecretEnc();
        if (enc != null && !enc.isBlank()) {
            return crypto.decrypt(enc);
        }
        return defaultMsClientSecret != null ? defaultMsClientSecret : "";
    }

    public String getMicrosoftTenantId() {
        String v = pick(getEntity().getMicrosoftTenantId(), defaultMsTenantId);
        return v.isBlank() ? "common" : v;
    }

    public String getMicrosoftRedirectUri() {
        return pick(getEntity().getMicrosoftRedirectUri(), defaultMsRedirectUri);
    }

    public boolean isMicrosoftConfigured() {
        return !getMicrosoftClientId().isBlank() && !getMicrosoftClientSecret().isBlank();
    }

    public String getGoogleClientId() {
        return pick(getEntity().getGoogleClientId(), defaultGoogleClientId);
    }

    public String getGoogleClientSecret() {
        String enc = getEntity().getGoogleClientSecretEnc();
        if (enc != null && !enc.isBlank()) {
            return crypto.decrypt(enc);
        }
        return defaultGoogleClientSecret != null ? defaultGoogleClientSecret : "";
    }

    public String getGoogleRedirectUri() {
        return pick(getEntity().getGoogleRedirectUri(), defaultGoogleRedirectUri);
    }

    public boolean isGoogleConfigured() {
        return !getGoogleClientId().isBlank() && !getGoogleClientSecret().isBlank();
    }

    // ==================== API ADMINISTRATION (LECTURE / SAUVEGARDE À CHAUD) ====================

    public MailIntegrationConfigDTO getConfigDto() {
        MailIntegrationConfig cfg = getEntity();
        MailIntegrationConfigDTO dto = new MailIntegrationConfigDTO();
        dto.setEnabled(cfg.isEnabled());
        dto.setFrontendUrl(getFrontendUrl());

        dto.setMicrosoftClientId(getMicrosoftClientId());
        dto.setHasMicrosoftClientSecret(!getMicrosoftClientSecret().isBlank());
        dto.setMicrosoftTenantId(getMicrosoftTenantId());
        dto.setMicrosoftRedirectUri(getMicrosoftRedirectUri());
        dto.setMicrosoftConfigured(isMicrosoftConfigured());

        dto.setGoogleClientId(getGoogleClientId());
        dto.setHasGoogleClientSecret(!getGoogleClientSecret().isBlank());
        dto.setGoogleRedirectUri(getGoogleRedirectUri());
        dto.setGoogleConfigured(isGoogleConfigured());

        dto.setUpdatedAt(cfg.getUpdatedAt());
        return dto;
    }

    @Transactional
    public MailIntegrationConfigDTO saveConfig(MailIntegrationConfigDTO dto) {
        MailIntegrationConfig cfg = repository.findById(1L).orElseGet(MailIntegrationConfig::new);
        cfg.setId(1L);
        cfg.setEnabled(dto.isEnabled());
        cfg.setFrontendUrl(trimToNull(dto.getFrontendUrl()));

        cfg.setMicrosoftClientId(trimToNull(dto.getMicrosoftClientId()));
        cfg.setMicrosoftTenantId(trimToNull(dto.getMicrosoftTenantId()));
        cfg.setMicrosoftRedirectUri(trimToNull(dto.getMicrosoftRedirectUri()));
        if (dto.isClearMicrosoftSecret()) {
            cfg.setMicrosoftClientSecretEnc(null);
        } else if (dto.getMicrosoftClientSecret() != null && !dto.getMicrosoftClientSecret().isBlank()) {
            cfg.setMicrosoftClientSecretEnc(crypto.encrypt(dto.getMicrosoftClientSecret().trim()));
        }

        cfg.setGoogleClientId(trimToNull(dto.getGoogleClientId()));
        cfg.setGoogleRedirectUri(trimToNull(dto.getGoogleRedirectUri()));
        if (dto.isClearGoogleSecret()) {
            cfg.setGoogleClientSecretEnc(null);
        } else if (dto.getGoogleClientSecret() != null && !dto.getGoogleClientSecret().isBlank()) {
            cfg.setGoogleClientSecretEnc(crypto.encrypt(dto.getGoogleClientSecret().trim()));
        }

        cachedConfig = repository.save(cfg);
        return getConfigDto();
    }

    private static String pick(String dbVal, String fallback) {
        if (dbVal != null && !dbVal.isBlank()) return dbVal.trim();
        return fallback != null ? fallback.trim() : "";
    }

    private static String trimToNull(String v) {
        if (v == null || v.isBlank()) return null;
        return v.trim();
    }
}
