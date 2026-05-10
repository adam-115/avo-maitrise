package com.avo.controller;

import com.avo.dtos.DiligenceFormResultDTO;
import com.avo.entities.DiligenceFormResult;
import com.avo.services.DiligenceFormResultService;
import com.querydsl.core.types.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/diligenceFormResult")
@RequiredArgsConstructor
public class DiligenceFormResultController {

    private final DiligenceFormResultService service;

    @GetMapping
    public ResponseEntity<Page<DiligenceFormResultDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<DiligenceFormResultDTO>> search(@QuerydslPredicate(root = DiligenceFormResult.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<DiligenceFormResultDTO>> findByClientId(@PathVariable Long clientId) {
        return ResponseEntity.ok(service.findByClientId(clientId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DiligenceFormResultDTO> findById(@PathVariable String id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<DiligenceFormResultDTO> create(@RequestBody DiligenceFormResultDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DiligenceFormResultDTO> update(@PathVariable String id, @RequestBody DiligenceFormResultDTO dto) {
        dto.setId(id);
        return ResponseEntity.ok(service.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
