package com.avo.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.avo.dtos.InvoiceDossierServieStatusDTO;
import com.avo.entities.InvoiceDossierServieStatus;
import com.avo.services.InvoiceDossierServieStatusService;
import com.querydsl.core.types.Predicate;
import java.util.List;

@RestController
@RequestMapping("/api/InvoiceDossierServieStatus")
public class InvoiceDossierServieStatusController {

    private final InvoiceDossierServieStatusService service;

    public InvoiceDossierServieStatusController(InvoiceDossierServieStatusService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<InvoiceDossierServieStatusDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<InvoiceDossierServieStatusDTO>> search(
            @QuerydslPredicate(root = InvoiceDossierServieStatus.class) Predicate predicate,
            Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceDossierServieStatusDTO> getById(@PathVariable Long id) {
        InvoiceDossierServieStatusDTO result = service.findById(id);
        if (result != null) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<InvoiceDossierServieStatusDTO> create(@RequestBody InvoiceDossierServieStatusDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping
    public ResponseEntity<InvoiceDossierServieStatusDTO> update(@RequestBody InvoiceDossierServieStatusDTO dto) {
        return ResponseEntity.ok(service.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }
}
