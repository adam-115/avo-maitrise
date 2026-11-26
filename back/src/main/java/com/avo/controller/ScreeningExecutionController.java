package com.avo.controller;

import com.avo.audit.AuditAccess;
import com.avo.audit.AuditAction;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.avo.dtos.ScreeningExecutionDTO;
import com.avo.entities.ClientEntity;
import com.avo.entities.ScreeningExecution;
import com.avo.job.YenteClientVerificationJob;
import com.avo.repositories.ClientRepository;
import com.avo.yente.models.AmlAnalysisResult;
import com.avo.yente.service.ScreeningExecutionService;
import com.avo.yente.service.YenteAmlService;
import com.querydsl.core.types.Predicate;

@RestController
@RequestMapping("/api/screening/matches/execution")
public class ScreeningExecutionController {

    private final ScreeningExecutionService service;
    private final YenteClientVerificationJob verificationJob;
    private final YenteAmlService yenteAmlService;
    private final ClientRepository clientRepository;

    public ScreeningExecutionController(ScreeningExecutionService service, com.avo.job.YenteClientVerificationJob verificationJob, YenteAmlService yenteAmlService, ClientRepository clientRepository) {
        this.service = service;
        this.verificationJob = verificationJob;
        this.yenteAmlService = yenteAmlService;
        this.clientRepository = clientRepository;
    }

    @AuditAccess(action = AuditAction.DECLENCHEMENT_FILTRAGE, resource = "CLIENT", idParam = "", details = "Filtrage de tous les clients")
    @PostMapping("/trigger-clients")
    public ResponseEntity<Void> triggerClients() {
        verificationJob.executeMatchClient();
        verificationJob.executeMatchUbos();
        return ResponseEntity.ok().build();
    }

    @AuditAccess(action = AuditAction.DECLENCHEMENT_FILTRAGE, resource = "UBO", idParam = "", details = "Filtrage de tous les bénéficiaires effectifs")
    @PostMapping("/trigger-ubos")
    public ResponseEntity<Void> triggerUbos() {
        verificationJob.executeMatchUbos();
        return ResponseEntity.ok().build();
    }

    @AuditAccess(action = AuditAction.DECLENCHEMENT_FILTRAGE, resource = "CLIENT", idParam = "clientId")
    @PostMapping("/trigger-client/{clientId}")
    public ResponseEntity<java.util.Map<String, String>> triggerClient(@PathVariable Long clientId) {
        ClientEntity client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found"));
        if (client.isDeleted()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "Impossible de lancer une vérification AML/KYC sur un client supprimé.");
        }
        verificationJob.processAMLForClient(List.of(client));        
        // List<AmlAnalysisResult> results = yenteAmlService.checkClientStatus(client);
        return ResponseEntity.ok(java.util.Map.of("status", "OK"));
    }

    

    @GetMapping
    public ResponseEntity<Page<ScreeningExecutionDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ScreeningExecutionDTO>> search(@QuerydslPredicate(root = ScreeningExecution.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @AuditAccess(action = AuditAction.CONSULTATION, resource = "CLIENT", idParam = "clientId", details = "Historique des filtrages du client")
    @GetMapping("/by-client/{clientId}")
    public ResponseEntity<Page<ScreeningExecutionDTO>> findByClientId(@PathVariable Long clientId, Pageable pageable) {
        return ResponseEntity.ok(service.findByClientId(clientId, pageable));
    }

    @AuditAccess(action = AuditAction.CONSULTATION, resource = "UBO", idParam = "uboId", details = "Historique des filtrages du bénéficiaire effectif")
    @GetMapping("/by-ubo/{uboId}")
    public ResponseEntity<Page<ScreeningExecutionDTO>> findByUboId(@PathVariable Long uboId, Pageable pageable) {
        return ResponseEntity.ok(service.findByUboId(uboId, pageable));
    }

    @AuditAccess(action = AuditAction.CONSULTATION, resource = "FILTRAGE_LCBFT")
    @GetMapping("/{id}")
    public ResponseEntity<ScreeningExecutionDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<ScreeningExecutionDTO> create(@Valid @RequestBody ScreeningExecutionDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping
    public ResponseEntity<ScreeningExecutionDTO> update(@Valid @RequestBody ScreeningExecutionDTO dto) {
        return ResponseEntity.ok(service.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
