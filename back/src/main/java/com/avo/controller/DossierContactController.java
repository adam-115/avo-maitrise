package com.avo.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.avo.dtos.DossierContactDTO;
import com.avo.entities.DossierContact;
import com.avo.services.DossierContactService;
import com.querydsl.core.types.Predicate;
import java.util.List;

@RestController
@RequestMapping("/api/DossierContact")
public class DossierContactController {

    private final DossierContactService service;

    public DossierContactController(DossierContactService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<DossierContactDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<DossierContactDTO>> search(@QuerydslPredicate(root = DossierContact.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DossierContactDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping("/dossier/{dossierId}")
    public ResponseEntity<List<DossierContactDTO>> findByDossierId(@PathVariable Long dossierId) {
        return ResponseEntity.ok(service.findByDossierId(dossierId));
    }

    @PostMapping
    public ResponseEntity<DossierContactDTO> create(@RequestBody DossierContactDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping
    public ResponseEntity<DossierContactDTO> update(@RequestBody DossierContactDTO dto) {
        return ResponseEntity.ok(service.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
