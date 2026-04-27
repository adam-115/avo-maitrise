package com.avo.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.avo.dtos.ScreeningMatchDTO;
import com.avo.entities.ScreeningMatch;
import com.avo.services.ScreeningMatchService;
import com.querydsl.core.types.Predicate;

@RestController
@RequestMapping("/api/screening/matches")
public class ScreeningMatchController {

    private final ScreeningMatchService service;

    public ScreeningMatchController(ScreeningMatchService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<ScreeningMatchDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ScreeningMatchDTO>> search(@QuerydslPredicate(root = ScreeningMatch.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ScreeningMatchDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<ScreeningMatchDTO> create(@RequestBody ScreeningMatchDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping
    public ResponseEntity<ScreeningMatchDTO> update(@RequestBody ScreeningMatchDTO dto) {
        return ResponseEntity.ok(service.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
