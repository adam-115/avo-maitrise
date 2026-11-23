package com.avo.audit;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Point d'entrée unique pour tracer une consultation, un téléchargement, un export ou un accès IA.
 * L'utilisateur, l'IP et le navigateur sont capturés ici, dans le thread de la requête,
 * avant l'écriture asynchrone (le thread d'arrière-plan n'a plus accès à la requête).
 */
@Service
public class AuditService {

    private final AuditLogWriter writer;

    public AuditService(AuditLogWriter writer) {
        this.writer = writer;
    }

    public void record(AuditAction action, String resourceType, Object resourceId, AuditOutcome outcome, String details) {
        AuditLog entry = new AuditLog();
        entry.setEventTime(LocalDateTime.now());
        entry.setUsername(AuditContext.currentUser());
        entry.setAction(action);
        entry.setResourceType(resourceType);
        entry.setResourceId(resourceId == null ? null : AuditContext.truncate(String.valueOf(resourceId), 100));
        entry.setOutcome(outcome);
        entry.setDetails(AuditContext.truncate(details, 1000));
        entry.setIpAddress(AuditContext.currentIp());
        entry.setUserAgent(AuditContext.currentUserAgent());
        writer.write(entry);
    }

    public void record(AuditAction action, String resourceType, Object resourceId) {
        record(action, resourceType, resourceId, AuditOutcome.SUCCES, null);
    }
}
