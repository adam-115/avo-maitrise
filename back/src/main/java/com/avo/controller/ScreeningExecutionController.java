package com.avo.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.avo.dtos.ScreeningExecutionDTO;
import com.avo.entities.ScreeningExecution;
import com.avo.yente.service.ScreeningExecutionService;
import com.querydsl.core.types.Predicate;

@RestController
@RequestMapping("/api/screening/log-matches")
public class ScreeningExecutionController {

    private final ScreeningExecutionService service;

    public ScreeningExecutionController(ScreeningExecutionService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<ScreeningExecutionDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ScreeningExecutionDTO>> search(@QuerydslPredicate(root = ScreeningExecution.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ScreeningExecutionDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<ScreeningExecutionDTO> create(@RequestBody ScreeningExecutionDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping
    public ResponseEntity<ScreeningExecutionDTO> update(@RequestBody ScreeningExecutionDTO dto) {
        return ResponseEntity.ok(service.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
