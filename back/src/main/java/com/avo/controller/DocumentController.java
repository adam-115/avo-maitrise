package com.avo.controller;

import com.avo.audit.AuditAccess;
import com.avo.audit.AuditAction;

import jakarta.validation.Valid;

import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.avo.dtos.DocumentDTO;
import com.avo.entities.Document;
import com.avo.services.DocumentService;
import com.querydsl.core.types.Predicate;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService service) {
        this.documentService = service;
    }

    @GetMapping
    public ResponseEntity<Page<DocumentDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(documentService.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<DocumentDTO>> search(@QuerydslPredicate(root = Document.class) Predicate predicate,
            Pageable pageable) {
        return ResponseEntity.ok(documentService.search(predicate, pageable));
    }

    @AuditAccess(action = AuditAction.CONSULTATION, resource = "DOCUMENT")
    @GetMapping("/{id}")
    public ResponseEntity<DocumentDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(documentService.findById(id));
    }

    @AuditAccess(action = AuditAction.TELECHARGEMENT, resource = "DOCUMENT")
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        return documentService.downloadFile(id);
    }

    @PostMapping
    public ResponseEntity<DocumentDTO> create(@Valid @RequestBody DocumentDTO dto) {
        return ResponseEntity.ok(documentService.create(dto));
    }

    @PutMapping(value = { "", "/{id}" })
    public ResponseEntity<DocumentDTO> update(@PathVariable(required = false) Long id,
            @Valid @RequestBody DocumentDTO dto) {
        if (id != null && dto.getId() == null) {
            dto.setId(id);
        }
        return ResponseEntity.ok(documentService.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        documentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
