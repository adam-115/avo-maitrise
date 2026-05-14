package com.avo.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.avo.dtos.TaskStatusDTO;
import com.avo.entities.TaskStatus;
import com.avo.services.TaskStatusService;
import com.querydsl.core.types.Predicate;

@RestController
@RequestMapping("/api/TaskStatus")
public class TaskStatusController {

    private final TaskStatusService service;

    public TaskStatusController(TaskStatusService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<TaskStatusDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<TaskStatusDTO>> search(@QuerydslPredicate(root = TaskStatus.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskStatusDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<TaskStatusDTO> create(@RequestBody TaskStatusDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping
    public ResponseEntity<TaskStatusDTO> update(@RequestBody TaskStatusDTO dto) {
        return ResponseEntity.ok(service.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
