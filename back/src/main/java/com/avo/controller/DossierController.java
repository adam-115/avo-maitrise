package com.avo.controller;

import com.avo.audit.AuditAccess;
import com.avo.audit.AuditAction;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.avo.dtos.DossierDTO;
import com.avo.entities.Dossier;
import com.avo.services.DossierService;
import com.querydsl.core.types.Predicate;

@RestController
@RequestMapping("/api/Dossier")
public class DossierController {

    private final DossierService service;

    public DossierController(DossierService service) {
        this.service = service;
    }

    @GetMapping("/kpis")
    public ResponseEntity<java.util.Map<String, Long>> getKpis() {
        return ResponseEntity.ok(service.getKpis());
    }

    @GetMapping("/all")
    public ResponseEntity<java.util.List<DossierDTO>> findAllNoPage() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping
    public ResponseEntity<Page<DossierDTO>> findAll(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) String statusFilter,
            @RequestParam(required = false) String lawyerFilter,
            @RequestParam(required = false, defaultValue = "ACTIVE") String deletedFilter,
            Pageable pageable) {
        return ResponseEntity.ok(service.findAllWithFilters(searchTerm, statusFilter, lawyerFilter, deletedFilter, pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<DossierDTO>> search(@QuerydslPredicate(root = Dossier.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @AuditAccess(action = AuditAction.CONSULTATION, resource = "DOSSIER")
    @GetMapping("/{id}")
    public ResponseEntity<DossierDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<DossierDTO> create(@Valid @RequestBody DossierDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping(value = {"", "/{id}"})
    public ResponseEntity<DossierDTO> update(@PathVariable(required = false) Long id, @Valid @RequestBody DossierDTO dto) {
        if (id != null && dto.getId() == null) {
            dto.setId(id);
        }
        return ResponseEntity.ok(service.update(dto));
    }

    @PatchMapping("/{id}/description")
    public ResponseEntity<DossierDTO> updateDescription(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Object> body) {
        String description = body.get("description") != null ? String.valueOf(body.get("description")) : null;
        Long audioDocId = null;
        if (body.get("descriptionAudioDocumentId") != null && !String.valueOf(body.get("descriptionAudioDocumentId")).isBlank()) {
            audioDocId = Long.valueOf(String.valueOf(body.get("descriptionAudioDocumentId")));
        }
        return ResponseEntity.ok(service.updateDescription(id, description, audioDocId));
    }

    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'AVOCAT', 'admin', 'super_admin', 'avocat')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'AVOCAT', 'admin', 'super_admin', 'avocat')")
    @PostMapping("/{id}/restore")
    public ResponseEntity<DossierDTO> restore(@PathVariable Long id) {
        return ResponseEntity.ok(service.restore(id));
    }
}
