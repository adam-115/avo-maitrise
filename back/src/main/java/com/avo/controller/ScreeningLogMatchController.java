package com.avo.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.avo.dtos.ScreeningLogMatchDTO;
import com.avo.entities.ScreeningLogMatch;
import com.avo.yente.service.ScreeningLogMatchService;
import com.querydsl.core.types.Predicate;

@RestController
@RequestMapping("/api/screening/log-matches")
public class ScreeningLogMatchController {

    private final ScreeningLogMatchService service;

    public ScreeningLogMatchController(ScreeningLogMatchService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<ScreeningLogMatchDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ScreeningLogMatchDTO>> search(@QuerydslPredicate(root = ScreeningLogMatch.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ScreeningLogMatchDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<ScreeningLogMatchDTO> create(@RequestBody ScreeningLogMatchDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping
    public ResponseEntity<ScreeningLogMatchDTO> update(@RequestBody ScreeningLogMatchDTO dto) {
        return ResponseEntity.ok(service.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
