package com.avo.services.mail;

import com.avo.entities.MailIntegrationConfig;
import com.avo.repositories.MailIntegrationConfigRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Gère l'activation/désactivation optionnelle de l'intégration Messagerie & Calendrier.
 * Mis en cache en mémoire pour zéro surcoût lorsque le module est désactivé.
 */
@Service
public class MailIntegrationConfigService {

    private final MailIntegrationConfigRepository repository;
    private final boolean defaultEnabled;
    private volatile Boolean cachedEnabled;

    public MailIntegrationConfigService(MailIntegrationConfigRepository repository,
                                        @Value("${mail.integration.enabled:false}") boolean defaultEnabled) {
        this.repository = repository;
        this.defaultEnabled = defaultEnabled;
    }

    public boolean isEnabled() {
        Boolean val = cachedEnabled;
        if (val != null) return val;
        boolean resolved = repository.findById(1L)
                .map(MailIntegrationConfig::isEnabled)
                .orElse(defaultEnabled);
        cachedEnabled = resolved;
        return resolved;
    }

    @Transactional
    public boolean setEnabled(boolean enabled) {
        MailIntegrationConfig cfg = repository.findById(1L).orElseGet(MailIntegrationConfig::new);
        cfg.setId(1L);
        cfg.setEnabled(enabled);
        repository.save(cfg);
        cachedEnabled = enabled;
        return enabled;
    }
}
