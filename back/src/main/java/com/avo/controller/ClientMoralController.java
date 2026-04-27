package com.avo.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.avo.dtos.ClientMoralDTO;
import com.avo.entities.ClientMoral;
import com.avo.services.ClientMoralService;
import com.querydsl.core.types.Predicate;

@RestController
@RequestMapping("/api/clients/moral")
public class ClientMoralController {

    private final ClientMoralService service;

    public ClientMoralController(ClientMoralService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<ClientMoralDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ClientMoralDTO>> search(@QuerydslPredicate(root = ClientMoral.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClientMoralDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<ClientMoralDTO> create(@RequestBody ClientMoralDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping
    public ResponseEntity<ClientMoralDTO> update(@RequestBody ClientMoralDTO dto) {
        return ResponseEntity.ok(service.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
