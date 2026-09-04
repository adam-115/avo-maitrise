package com.avo.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.avo.dtos.DomaineJuridiqueDTO;
import com.avo.entities.DomaineJuridique;
import com.avo.services.DomaineJuridiqueService;
import com.querydsl.core.types.Predicate;

@RestController
@RequestMapping("/api/DomaineJuridique")
public class DomaineJuridiqueController {

    private final DomaineJuridiqueService service;

    public DomaineJuridiqueController(DomaineJuridiqueService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<DomaineJuridiqueDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<DomaineJuridiqueDTO>> search(@QuerydslPredicate(root = DomaineJuridique.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DomaineJuridiqueDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<DomaineJuridiqueDTO> create(@RequestBody DomaineJuridiqueDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping(value = {"", "/{id}"})
    public ResponseEntity<DomaineJuridiqueDTO> update(@PathVariable(required = false) Long id, @RequestBody DomaineJuridiqueDTO dto) {
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
