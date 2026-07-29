package com.avo.controller;

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

    @PostMapping("/trigger-clients")
    public ResponseEntity<Void> triggerClients() {
        verificationJob.executeMatchClient();
        verificationJob.executeMatchUbos();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/trigger-ubos")
    public ResponseEntity<Void> triggerUbos() {
        verificationJob.executeMatchUbos();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/trigger-client/{clientId}")
    public ResponseEntity<java.util.Map<String, String>> triggerClient(@PathVariable Long clientId) {
        ClientEntity client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found"));
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

    @GetMapping("/by-client/{clientId}")
    public ResponseEntity<Page<ScreeningExecutionDTO>> findByClientId(@PathVariable Long clientId, Pageable pageable) {
        return ResponseEntity.ok(service.findByClientId(clientId, pageable));
    }

    @GetMapping("/by-ubo/{uboId}")
    public ResponseEntity<Page<ScreeningExecutionDTO>> findByUboId(@PathVariable Long uboId, Pageable pageable) {
        return ResponseEntity.ok(service.findByUboId(uboId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ScreeningExecutionDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<ScreeningExecutionDTO> create(@RequestBody ScreeningExecutionDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping
    public ResponseEntity<ScreeningExecutionDTO> update(@RequestBody ScreeningExecutionDTO dto) {
        return ResponseEntity.ok(service.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
