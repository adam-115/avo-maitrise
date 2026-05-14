package com.avo.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.avo.dtos.DossierPrioriteDTO;
import com.avo.entities.DossierPriorite;
import com.avo.services.DossierPrioriteService;
import com.querydsl.core.types.Predicate;

@RestController
@RequestMapping("/api/DossierPriorite")
public class DossierPrioriteController {

    private final DossierPrioriteService service;

    public DossierPrioriteController(DossierPrioriteService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<DossierPrioriteDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<DossierPrioriteDTO>> search(@QuerydslPredicate(root = DossierPriorite.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DossierPrioriteDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<DossierPrioriteDTO> create(@RequestBody DossierPrioriteDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping
    public ResponseEntity<DossierPrioriteDTO> update(@RequestBody DossierPrioriteDTO dto) {
        return ResponseEntity.ok(service.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
