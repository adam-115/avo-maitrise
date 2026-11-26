package com.avo.controller;

import com.avo.audit.AuditAccess;
import com.avo.audit.AuditAction;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.avo.dtos.ScreeningMatchDTO;
import com.avo.entities.ScreeningMatch;
import com.avo.services.ScreeningMatchService;
import com.querydsl.core.types.Predicate;

@RestController
@RequestMapping("/api/screening/matches")
public class ScreeningMatchController {

    private final ScreeningMatchService service;

    public ScreeningMatchController(ScreeningMatchService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<ScreeningMatchDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ScreeningMatchDTO>> search(@QuerydslPredicate(root = ScreeningMatch.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @AuditAccess(action = AuditAction.CONSULTATION, resource = "ALERTE_LCBFT")
    @GetMapping("/{id}")
    public ResponseEntity<ScreeningMatchDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<ScreeningMatchDTO> create(@Valid @RequestBody ScreeningMatchDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping
    public ResponseEntity<ScreeningMatchDTO> update(@Valid @RequestBody ScreeningMatchDTO dto) {
        return ResponseEntity.ok(service.update(dto));
    }

    @PostMapping("/{id}/process-decision")
    public ResponseEntity<ScreeningMatchDTO> processDecision(
            @PathVariable Long id,
            @RequestParam com.avo.entities.ScreeningMatchStatus decision,
            @RequestParam(required = false) String comment,
            @RequestParam(required = false) String reviewer) {
        return ResponseEntity.ok(service.processDecision(id, decision, comment, reviewer));
    }

    @PostMapping("/batch-decision")
    public ResponseEntity<java.util.List<ScreeningMatchDTO>> processBatchDecision(
            @Valid @RequestBody java.util.List<Long> matchIds,
            @RequestParam com.avo.entities.ScreeningMatchStatus decision,
            @RequestParam(required = false) String comment,
            @RequestParam(required = false) String reviewer) {
        return ResponseEntity.ok(service.processBatchDecision(matchIds, decision, comment, reviewer));
    }

    @AuditAccess(action = AuditAction.CONSULTATION, resource = "CLIENT", idParam = "clientId", details = "Alertes LCB-FT du client")
    @GetMapping("/by-client/{clientId}")
    public ResponseEntity<Page<ScreeningMatchDTO>> findByClientId(@PathVariable Long clientId, Pageable pageable) {
        return ResponseEntity.ok(service.findByClientId(clientId, pageable));
    }

    @AuditAccess(action = AuditAction.CONSULTATION, resource = "UBO", idParam = "uboId", details = "Alertes LCB-FT du bénéficiaire effectif")
    @GetMapping("/by-ubo/{uboId}")
    public ResponseEntity<Page<ScreeningMatchDTO>> findByUboId(@PathVariable Long uboId, Pageable pageable) {
        return ResponseEntity.ok(service.findByUboId(uboId, pageable));
    }

    // @DeleteMapping("/{id}")
    // public ResponseEntity<Void> delete(@PathVariable Long id) {
    //     service.delete(id);
    //     return ResponseEntity.noContent().build();
    // }
}
