package com.avo.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.avo.dtos.ClientPersonnePhysiqueDTO;
import com.avo.entities.ClientPersonnePhysique;
import com.avo.services.PersonnePhysiqueService;
import com.querydsl.core.types.Predicate;

@RestController
@RequestMapping("/api/clients/physique")
public class PersonnePhysiqueController {

    private final PersonnePhysiqueService service;

    public PersonnePhysiqueController(PersonnePhysiqueService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<ClientPersonnePhysiqueDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ClientPersonnePhysiqueDTO>> search(@QuerydslPredicate(root = ClientPersonnePhysique.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClientPersonnePhysiqueDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<ClientPersonnePhysiqueDTO> create(@RequestBody ClientPersonnePhysiqueDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping
    public ResponseEntity<ClientPersonnePhysiqueDTO> update(@RequestBody ClientPersonnePhysiqueDTO dto) {
        return ResponseEntity.ok(service.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
