package com.avo.audit;

import com.avo.audit.seal.AuditIntegrityReport;
import com.avo.audit.seal.AuditIntegrityService;
import com.avo.audit.seal.AuditSealService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Vérification d'intégrité du journal d'audit. Réservé aux administrateurs (voir SecurityConfig). */
@RestController
@RequestMapping("/api/audit")
public class AuditIntegrityController {

    private final AuditIntegrityService integrityService;
    private final AuditSealService sealService;

    public AuditIntegrityController(AuditIntegrityService integrityService, AuditSealService sealService) {
        this.integrityService = integrityService;
        this.sealService = sealService;
    }

    /** Recalcule toute la chaîne de sceaux et contrôle les protections. La consultation est elle-même tracée. */
    @AuditAccess(action = AuditAction.CONSULTATION, resource = "JOURNAL_AUDIT", idParam = "", details = "Vérification d'intégrité")
    @GetMapping("/integrity")
    public ResponseEntity<AuditIntegrityReport> verify() {
        return ResponseEntity.ok(integrityService.verify());
    }

    /** Scelle immédiatement les éléments en attente (au-delà de la marge de sécurité), sans attendre la tâche planifiée. */
    @PostMapping("/seal")
    public ResponseEntity<Map<String, Integer>> sealNow() {
        return ResponseEntity.ok(Map.of("sealed", sealService.sealPending()));
    }
}
