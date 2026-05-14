package com.avo.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.avo.dtos.TaskCategoryDTO;
import com.avo.entities.TaskCategory;
import com.avo.services.TaskCategoryService;
import com.querydsl.core.types.Predicate;

@RestController
@RequestMapping("/api/TaskCategory")
public class TaskCategoryController {

    private final TaskCategoryService service;

    public TaskCategoryController(TaskCategoryService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<TaskCategoryDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<TaskCategoryDTO>> search(@QuerydslPredicate(root = TaskCategory.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskCategoryDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<TaskCategoryDTO> create(@RequestBody TaskCategoryDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping
    public ResponseEntity<TaskCategoryDTO> update(@RequestBody TaskCategoryDTO dto) {
        return ResponseEntity.ok(service.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
