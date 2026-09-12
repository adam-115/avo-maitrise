package com.avo.controller;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.avo.dtos.DossierDTO;
import com.avo.entities.Dossier;
import com.avo.services.DossierService;
import com.querydsl.core.types.Predicate;

@RestController
@RequestMapping("/api/Dossier")
@PreAuthorize("isAuthenticated()")
public class DossierController {

    private final DossierService service;

    public DossierController(DossierService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<DossierDTO>> findAll(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) String statusFilter,
            @RequestParam(required = false) String lawyerFilter,
            Pageable pageable) {
        return ResponseEntity.ok(service.findAllWithFilters(searchTerm, statusFilter, lawyerFilter, pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<DossierDTO>> search(@QuerydslPredicate(root = Dossier.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@securityUtils.canAccessDossier(#id)")
    public ResponseEntity<DossierDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<DossierDTO> create(@Valid @RequestBody DossierDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping(value = {"", "/{id}"})
    @PreAuthorize("@securityUtils.canAccessDossier(#dto.id != null ? #dto.id : #id)")
    public ResponseEntity<DossierDTO> update(@PathVariable(required = false) Long id, @Valid @RequestBody DossierDTO dto) {
        if (id != null && dto.getId() == null) {
            dto.setId(id);
        }
        return ResponseEntity.ok(service.update(dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'ASSOCIE', 'PARTNER') or @securityUtils.canAccessDossier(#id)")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

