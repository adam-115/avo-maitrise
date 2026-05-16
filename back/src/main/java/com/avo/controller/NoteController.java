package com.avo.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.avo.dtos.NoteDTO;
import com.avo.entities.Note;
import com.avo.services.NoteService;
import com.querydsl.core.types.Predicate;
import java.util.List;

@RestController
@RequestMapping("/api/Note")
public class NoteController {

    private final NoteService service;

    public NoteController(NoteService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<NoteDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<NoteDTO>> search(@QuerydslPredicate(root = Note.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NoteDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping("/dossier/{dossierId}")
    public ResponseEntity<List<NoteDTO>> findByDossierId(@PathVariable Long dossierId) {
        return ResponseEntity.ok(service.findByDossierId(dossierId));
    }

    @PostMapping
    public ResponseEntity<NoteDTO> create(@RequestBody NoteDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping
    public ResponseEntity<NoteDTO> update(@RequestBody NoteDTO dto) {
        return ResponseEntity.ok(service.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
