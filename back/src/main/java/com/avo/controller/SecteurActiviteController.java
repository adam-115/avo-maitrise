package com.avo.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.avo.dtos.SecteurActiviteDTO;
import com.avo.entities.SecteurActivite;
import com.avo.services.SecteurActiviteService;
import com.querydsl.core.types.Predicate;

@RestController
@RequestMapping("/api/SecteurActivite")
public class SecteurActiviteController {

    private final SecteurActiviteService service;

    public SecteurActiviteController(SecteurActiviteService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<SecteurActiviteDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<SecteurActiviteDTO>> search(@QuerydslPredicate(root = SecteurActivite.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SecteurActiviteDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<SecteurActiviteDTO> create(@RequestBody SecteurActiviteDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping
    public ResponseEntity<SecteurActiviteDTO> update(@RequestBody SecteurActiviteDTO dto) {
        return ResponseEntity.ok(service.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
