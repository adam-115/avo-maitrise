package com.avo.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.avo.dtos.MatterEventDTO;
import com.avo.entities.MatterEvent;
import com.avo.services.MatterEventService;
import com.querydsl.core.types.Predicate;

@RestController
@RequestMapping("/api/MatterEvent")
public class MatterEventController {

    private final MatterEventService service;

    public MatterEventController(MatterEventService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<MatterEventDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<MatterEventDTO>> search(@QuerydslPredicate(root = MatterEvent.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MatterEventDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<MatterEventDTO> create(@RequestBody MatterEventDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping
    public ResponseEntity<MatterEventDTO> update(@RequestBody MatterEventDTO dto) {
        return ResponseEntity.ok(service.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
