package com.avo.controller;

import com.avo.dtos.ClientDiligenceStatusDTO;
import com.avo.entities.ClientDiligenceStatus;
import com.avo.services.ClientDiligenceStatusService;
import com.querydsl.core.types.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/clientDiligenceStatus")
@RequiredArgsConstructor
public class ClientDiligenceStatusController {

    private final ClientDiligenceStatusService service;

    @GetMapping
    public ResponseEntity<Page<ClientDiligenceStatusDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ClientDiligenceStatusDTO>> search(@QuerydslPredicate(root = ClientDiligenceStatus.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }
    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<ClientDiligenceStatusDTO>> findByClientId(@PathVariable Long clientId) {
        return ResponseEntity.ok(service.findByClientId(clientId));
    }

    @GetMapping("/client/{clientId}/form/{formConfigId}")
    public ResponseEntity<ClientDiligenceStatusDTO> findByClientAndForm(@PathVariable Long clientId, @PathVariable String formConfigId) {
        return ResponseEntity.ok(service.findByClientIdAndFormConfigId(clientId, formConfigId));
    }

    @PostMapping
    public ResponseEntity<ClientDiligenceStatusDTO> create(@RequestBody ClientDiligenceStatusDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClientDiligenceStatusDTO> update(@PathVariable String id, @RequestBody ClientDiligenceStatusDTO dto) {
        dto.setId(id);
        return ResponseEntity.ok(service.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
