package com.avo.controller;

import com.avo.audit.AuditAccess;
import com.avo.audit.AuditAction;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.avo.dtos.ClientEntityDTO;
import com.avo.entities.ClientEntity;
import com.avo.entities.ClientStatus;
import com.avo.services.ClientService;
import com.avo.services.ReportingService;
import com.querydsl.core.types.Predicate;

@RestController
@RequestMapping("/api/clients")
public class ClientController {

    private final ClientService service;
    private final ReportingService reportingService;

    public ClientController(ClientService service, ReportingService reportingService) {
        this.service = service;
        this.reportingService = reportingService;
    }

    @AuditAccess(action = AuditAction.EXPORT, resource = "CLIENT", idParam = "", details = "Rapport LCB-FT global (PDF)")
    @GetMapping("/aml-report/pdf")
    public ResponseEntity<byte[]> generateAmlReport(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        byte[] pdfBytes = reportingService.generateGlobalAmlReport(startDate, endDate);
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("inline", "Rapport_Statut_Global_AML.pdf");
        return new ResponseEntity<>(pdfBytes, headers, org.springframework.http.HttpStatus.OK);
    }

    @AuditAccess(action = AuditAction.EXPORT, resource = "CLIENT", details = "Rapport d'audit KYC (PDF)")
    @GetMapping("/{id}/kyc-audit-report/pdf")
    public ResponseEntity<byte[]> generateClientKycAuditReport(@PathVariable Long id) {
        byte[] pdfBytes = reportingService.generateClientKycAuditReport(id);
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("inline", "Fiche_Vigilance_KYC_Client_" + id + ".pdf");
        return new ResponseEntity<>(pdfBytes, headers, org.springframework.http.HttpStatus.OK);
    }

    @AuditAccess(action = AuditAction.EXPORT, resource = "CLIENT", details = "Rapport d'audit GAFI (PDF)")
    @GetMapping("/{id}/fatf-audit-report/pdf")
    public ResponseEntity<byte[]> generateClientFatfAuditReport(@PathVariable Long id) {
        byte[] pdfBytes = reportingService.generateClientFatfAuditReport(id);
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("inline", "Rapport_Conformite_GAFI_Client_" + id + ".pdf");
        return new ResponseEntity<>(pdfBytes, headers, org.springframework.http.HttpStatus.OK);
    }


    @GetMapping
    public ResponseEntity<Page<ClientEntityDTO>> findAll(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String risk,
            @RequestParam(required = false, defaultValue = "ACTIVE") String deletedFilter,
            Pageable pageable) {
        com.avo.entities.ClientStatus clientStatus = null;
        if (status != null && !status.isEmpty()) {
            try {
                clientStatus = com.avo.entities.ClientStatus.valueOf(status);
            } catch (IllegalArgumentException e) {
                // Ignore invalid status value
            }
        }
        return ResponseEntity.ok(service.findAllWithFilters(searchTerm, type, clientStatus, risk, deletedFilter, pageable));
    }

    @GetMapping("/{id}/active-dossiers-count")
    public ResponseEntity<java.util.Map<String, Long>> countActiveDossiers(@PathVariable Long id) {
        return ResponseEntity.ok(java.util.Map.of("count", service.countActiveDossiers(id)));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ClientEntityDTO>> search(@QuerydslPredicate(root = ClientEntity.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @AuditAccess(action = AuditAction.CONSULTATION, resource = "CLIENT")
    @GetMapping("/{id}")
    public ResponseEntity<ClientEntityDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<ClientEntityDTO> create(@Valid @RequestBody ClientEntityDTO dto) {
        // default AML status creation 
        dto.setClientStatus(ClientStatus.AML_REQUIRED);
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping(value = {"", "/{id}"})
    public ResponseEntity<ClientEntityDTO> update(@PathVariable(required = false) Long id, @Valid @RequestBody ClientEntityDTO dto) {
        if (id != null && dto.getId() == null) {
            dto.setId(id);
        }
        return ResponseEntity.ok(service.update(dto));
    }

    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'AVOCAT', 'admin', 'super_admin', 'avocat')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean deleteDossiers) {
        service.delete(id, deleteDossiers);
        return ResponseEntity.noContent().build();
    }

    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'AVOCAT', 'admin', 'super_admin', 'avocat')")
    @PostMapping("/{id}/restore")
    public ResponseEntity<ClientEntityDTO> restore(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean restoreDossiers) {
        return ResponseEntity.ok(service.restore(id, restoreDossiers));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ClientEntityDTO> updateStatus(@PathVariable Long id, @Valid @RequestBody java.util.Map<String, String> updates) {
        String statusStr = updates.get("clientStatus");
        com.avo.entities.ClientStatus status = com.avo.entities.ClientStatus.valueOf(statusStr);
        return ResponseEntity.ok(service.updateStatus(id, status));
    }

    
}
