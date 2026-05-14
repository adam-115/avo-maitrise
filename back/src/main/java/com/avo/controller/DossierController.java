package com.avo.controller;

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

    @GetMapping
    public ResponseEntity<Page<DossierDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<DossierDTO>> search(@QuerydslPredicate(root = Dossier.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DossierDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<DossierDTO> create(@RequestBody DossierDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping
    public ResponseEntity<DossierDTO> update(@RequestBody DossierDTO dto) {
        return ResponseEntity.ok(service.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
