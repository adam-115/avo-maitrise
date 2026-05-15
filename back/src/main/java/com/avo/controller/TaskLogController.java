package com.avo.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.avo.dtos.TaskLogDTO;
import com.avo.entities.TaskLog;
import com.avo.services.TaskLogService;
import com.querydsl.core.types.Predicate;
import java.util.List;

@RestController
@RequestMapping("/api/taskLogs")
public class TaskLogController {

    private final TaskLogService service;

    public TaskLogController(TaskLogService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<TaskLogDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<TaskLogDTO>> search(@QuerydslPredicate(root = TaskLog.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskLogDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<TaskLogDTO>> findByTaskId(@PathVariable Long taskId) {
        return ResponseEntity.ok(service.findByTaskId(taskId));
    }

    @PostMapping
    public ResponseEntity<TaskLogDTO> create(@RequestBody TaskLogDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
