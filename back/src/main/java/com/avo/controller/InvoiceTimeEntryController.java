package com.avo.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.avo.dtos.InvoiceTimeEntryDTO;
import com.avo.entities.InvoiceTimeEntry;
import com.avo.services.InvoiceTimeEntryService;
import com.querydsl.core.types.Predicate;

@RestController
@RequestMapping("/api/InvoiceTimeEntry")
public class InvoiceTimeEntryController {

    private final InvoiceTimeEntryService service;

    public InvoiceTimeEntryController(InvoiceTimeEntryService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<InvoiceTimeEntryDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<InvoiceTimeEntryDTO>> search(
            @QuerydslPredicate(root = InvoiceTimeEntry.class) Predicate predicate,
            Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceTimeEntryDTO> getById(@PathVariable Long id) {
        InvoiceTimeEntryDTO result = service.findById(id);
        if (result != null) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<InvoiceTimeEntryDTO> create(@RequestBody InvoiceTimeEntryDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping(value = {"", "/{id}"})
    public ResponseEntity<InvoiceTimeEntryDTO> update(@PathVariable(required = false) Long id, @RequestBody InvoiceTimeEntryDTO dto) {
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
