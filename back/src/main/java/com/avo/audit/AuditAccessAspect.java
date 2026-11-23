package com.avo.audit;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.util.Collection;

/** Applique {@link AuditAccess} : trace l'accès, qu'il réussisse, soit refusé ou échoue. */
@Aspect
@Component
public class AuditAccessAspect {

    private final AuditService auditService;

    public AuditAccessAspect(AuditService auditService) {
        this.auditService = auditService;
    }

    @Around("@annotation(auditAccess)")
    public Object trace(ProceedingJoinPoint joinPoint, AuditAccess auditAccess) throws Throwable {
        Object resourceId = resolveId(joinPoint, auditAccess.idParam());
        String details = auditAccess.details().isEmpty() ? null : auditAccess.details();
        try {
            Object result = joinPoint.proceed();
            auditService.record(auditAccess.action(), auditAccess.resource(), resourceId, AuditOutcome.SUCCES, details);
            return result;
        } catch (AccessDeniedException e) {
            auditService.record(auditAccess.action(), auditAccess.resource(), resourceId, AuditOutcome.REFUSE, details);
            throw e;
        } catch (Throwable e) {
            String reason = e.getClass().getSimpleName() + (e.getMessage() != null ? " : " + e.getMessage() : "");
            auditService.record(auditAccess.action(), auditAccess.resource(), resourceId, AuditOutcome.ECHEC,
                    details == null ? reason : details + " | " + reason);
            throw e;
        }
    }

    private static Object resolveId(ProceedingJoinPoint joinPoint, String idParam) {
        if (idParam == null || idParam.isEmpty()) {
            return null;
        }
        String[] names = ((MethodSignature) joinPoint.getSignature()).getParameterNames();
        Object[] args = joinPoint.getArgs();
        if (names == null) {
            return null;
        }
        for (int i = 0; i < names.length; i++) {
            if (idParam.equals(names[i])) {
                Object value = args[i];
                // Listes d'identifiants (ex. export groupé de factures) : on garde la liste lisible.
                return value instanceof Collection<?> c ? String.join(",", c.stream().map(String::valueOf).toList()) : value;
            }
        }
        return null;
    }
}
