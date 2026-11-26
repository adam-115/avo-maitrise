package com.avo.audit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/** Insertion asynchrone d'une ligne de journal (bean séparé pour que @Async passe par le proxy Spring). */
@Component
class AuditLogWriter {

    private static final Logger log = LoggerFactory.getLogger(AuditLogWriter.class);

    private final AuditLogRepository repository;

    AuditLogWriter(AuditLogRepository repository) {
        this.repository = repository;
    }

    @Async("auditExecutor")
    public void write(AuditLog entry) {
        try {
            repository.save(entry);
        } catch (Exception e) {
            // Une trace perdue doit se voir dans les logs applicatifs, sans faire échouer la requête de l'utilisateur.
            log.error("ÉCHEC D'ÉCRITURE DU JOURNAL D'AUDIT : user={} action={} ressource={}#{} : {}",
                    entry.getUsername(), entry.getAction(), entry.getResourceType(), entry.getResourceId(),
                    e.getMessage(), e);
        }
    }
}
