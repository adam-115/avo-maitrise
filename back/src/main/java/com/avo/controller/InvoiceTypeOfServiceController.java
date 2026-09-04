package com.avo.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.avo.dtos.InvoiceTypeOfServiceDTO;
import com.avo.entities.InvoiceTypeOfService;
import com.avo.services.InvoiceTypeOfServiceService;
import com.querydsl.core.types.Predicate;

@RestController
@RequestMapping("/api/InvoiceTypeOfService")
public class InvoiceTypeOfServiceController {

    private final InvoiceTypeOfServiceService service;

    public InvoiceTypeOfServiceController(InvoiceTypeOfServiceService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<InvoiceTypeOfServiceDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<InvoiceTypeOfServiceDTO>> search(@QuerydslPredicate(root = InvoiceTypeOfService.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceTypeOfServiceDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<InvoiceTypeOfServiceDTO> create(@RequestBody InvoiceTypeOfServiceDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping(value = {"", "/{id}"})
    public ResponseEntity<InvoiceTypeOfServiceDTO> update(@PathVariable(required = false) Long id, @RequestBody InvoiceTypeOfServiceDTO dto) {
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
