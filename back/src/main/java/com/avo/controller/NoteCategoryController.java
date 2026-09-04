package com.avo.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.avo.dtos.NoteCategoryDTO;
import com.avo.entities.NoteCategory;
import com.avo.services.NoteCategoryService;
import com.querydsl.core.types.Predicate;

@RestController
@RequestMapping("/api/NoteCategory")
public class NoteCategoryController {

    private final NoteCategoryService service;

    public NoteCategoryController(NoteCategoryService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<NoteCategoryDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<NoteCategoryDTO>> search(@QuerydslPredicate(root = NoteCategory.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NoteCategoryDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<NoteCategoryDTO> create(@RequestBody NoteCategoryDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping(value = {"", "/{id}"})
    public ResponseEntity<NoteCategoryDTO> update(@PathVariable(required = false) Long id, @RequestBody NoteCategoryDTO dto) {
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
