package com.avo.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.avo.dtos.AppointementDTO;
import com.avo.entities.Appointement;
import com.avo.services.AppointementService;
import com.querydsl.core.types.Predicate;

@RestController
@RequestMapping("/api/appointements")
public class AppointementController {

    private final AppointementService service;

    public AppointementController(AppointementService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<AppointementDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<AppointementDTO>> search(@QuerydslPredicate(root = Appointement.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppointementDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<AppointementDTO> create(@RequestBody AppointementDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping(value = {"", "/{id}"})
    public ResponseEntity<AppointementDTO> update(@PathVariable(required = false) Long id, @RequestBody AppointementDTO dto) {
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
