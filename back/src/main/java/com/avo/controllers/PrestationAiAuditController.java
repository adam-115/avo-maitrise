package com.avo.controllers;

import com.avo.dtos.InvoiceDossierServiceDTO;
import com.avo.services.billing.PrestationAiAuditService;
import com.avo.services.billing.PrestationAiAuditService.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/prestations/ai-audit")
public class PrestationAiAuditController {

    private final PrestationAiAuditService auditService;

    public PrestationAiAuditController(PrestationAiAuditService auditService) {
        this.auditService = auditService;
    }

    @PostMapping("/dossier/{dossierId}")
    public ResponseEntity<AuditResult> auditDossier(@PathVariable Long dossierId) {
        return ResponseEntity.ok(auditService.auditDossier(dossierId));
    }

    @PostMapping("/dossier/{dossierId}/accept")
    public ResponseEntity<InvoiceDossierServiceDTO> acceptProposal(
            @PathVariable Long dossierId,
            @RequestBody AcceptProposalRequest request) {
        return ResponseEntity.ok(auditService.acceptProposal(dossierId, request));
    }

    @PostMapping("/dossier/{dossierId}/reject")
    public ResponseEntity<Map<String, Object>> rejectProposal(
            @PathVariable Long dossierId,
            @RequestBody RejectProposalRequest request) {
        auditService.rejectProposal(dossierId, request);
        return ResponseEntity.ok(Map.of("status", "REJECTED", "sourceKey", request.sourceKey()));
    }

    @DeleteMapping("/dossier/{dossierId}/decisions")
    public ResponseEntity<Map<String, Object>> resetRejected(@PathVariable Long dossierId) {
        auditService.resetRejectedDecisions(dossierId);
        return ResponseEntity.ok(Map.of("status", "RESET"));
    }
}
