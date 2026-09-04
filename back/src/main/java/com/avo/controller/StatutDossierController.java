package com.avo.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.avo.dtos.StatutDossierDTO;
import com.avo.entities.StatutDossier;
import com.avo.services.StatutDossierService;
import com.querydsl.core.types.Predicate;

@RestController
@RequestMapping("/api/StatutDossier")
public class StatutDossierController {

    private final StatutDossierService service;

    public StatutDossierController(StatutDossierService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<StatutDossierDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<StatutDossierDTO>> search(@QuerydslPredicate(root = StatutDossier.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StatutDossierDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<StatutDossierDTO> create(@RequestBody StatutDossierDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping(value = {"", "/{id}"})
    public ResponseEntity<StatutDossierDTO> update(@PathVariable(required = false) Long id, @RequestBody StatutDossierDTO dto) {
        if (id != null && dto.getId() == null) {
            dto.setId(id);
        }
        return ResponseEntity.ok(service.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
