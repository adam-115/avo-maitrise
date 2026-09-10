package com.avo.controller;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.avo.dtos.AssociationDTO;
import com.avo.entities.Association;
import com.avo.services.AssociationService;
import com.querydsl.core.types.Predicate;

@RestController
@RequestMapping("/api/clients/association")
public class AssociationController {

    private final AssociationService service;

    public AssociationController(AssociationService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<AssociationDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<AssociationDTO>> search(@QuerydslPredicate(root = Association.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AssociationDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'ASSOCIE', 'AVOCAT', 'SECRETARIAT')")
    public ResponseEntity<AssociationDTO> create(@Valid @RequestBody AssociationDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping(value = {"", "/{id}"})
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'ASSOCIE', 'AVOCAT', 'SECRETARIAT')")
    public ResponseEntity<AssociationDTO> update(@PathVariable(required = false) Long id, @Valid @RequestBody AssociationDTO dto) {
        if (id != null && dto.getId() == null) {
            dto.setId(id);
        }
        return ResponseEntity.ok(service.update(dto));
    }
}

