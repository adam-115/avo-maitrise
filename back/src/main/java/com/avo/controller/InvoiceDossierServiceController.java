package com.avo.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.avo.dtos.InvoiceDossierServiceDTO;
import com.avo.entities.InvoiceDossierService;
import com.avo.services.InvoiceDossierServiceService;
import com.querydsl.core.types.Predicate;

@RestController
@RequestMapping("/api/InvoiceDossierService")
public class InvoiceDossierServiceController {

    private final InvoiceDossierServiceService service;

    public InvoiceDossierServiceController(InvoiceDossierServiceService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<InvoiceDossierServiceDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<InvoiceDossierServiceDTO>> search(
            @QuerydslPredicate(root = InvoiceDossierService.class) Predicate predicate,
            Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceDossierServiceDTO> getById(@PathVariable Long id) {
        InvoiceDossierServiceDTO result = service.findById(id);
        if (result != null) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<InvoiceDossierServiceDTO> create(@RequestBody InvoiceDossierServiceDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping(value = {"", "/{id}"})
    public ResponseEntity<InvoiceDossierServiceDTO> update(@PathVariable(required = false) Long id, @RequestBody InvoiceDossierServiceDTO dto) {
        if (id != null && dto.getId() == null) {
            dto.setId(id);
        }
        return ResponseEntity.ok(service.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }
}
