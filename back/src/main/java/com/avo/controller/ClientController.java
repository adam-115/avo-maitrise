package com.avo.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.avo.dtos.ClientEntityDTO;
import com.avo.entities.ClientEntity;
import com.avo.entities.ClientStatus;
import com.avo.services.ClientService;
import com.avo.services.ReportingService;
import com.querydsl.core.types.Predicate;

@RestController
@RequestMapping("/api/clients")
public class ClientController {

    private final ClientService service;
    private final ReportingService reportingService;

    public ClientController(ClientService service, ReportingService reportingService) {
        this.service = service;
        this.reportingService = reportingService;
    }

    @GetMapping("/aml-report/pdf")
    public ResponseEntity<byte[]> generateAmlReport(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        byte[] pdfBytes = reportingService.generateGlobalAmlReport(startDate, endDate);
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("inline", "Rapport_Statut_Global_AML.pdf");
        return new ResponseEntity<>(pdfBytes, headers, org.springframework.http.HttpStatus.OK);
    }


    @GetMapping
    public ResponseEntity<Page<ClientEntityDTO>> findAll(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String risk,
            Pageable pageable) {
        com.avo.entities.ClientStatus clientStatus = null;
        if (status != null && !status.isEmpty()) {
            try {
                clientStatus = com.avo.entities.ClientStatus.valueOf(status);
            } catch (IllegalArgumentException e) {
                // Ignore invalid status value
            }
        }
        return ResponseEntity.ok(service.findAllWithFilters(searchTerm, type, clientStatus, risk, pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ClientEntityDTO>> search(@QuerydslPredicate(root = ClientEntity.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClientEntityDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<ClientEntityDTO> create(@RequestBody ClientEntityDTO dto) {
        // default AML status creation 
        dto.setClientStatus(ClientStatus.AML_REQUIRED);
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping
    public ResponseEntity<ClientEntityDTO> update(@RequestBody ClientEntityDTO dto) {
        return ResponseEntity.ok(service.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ClientEntityDTO> updateStatus(@PathVariable Long id, @RequestBody java.util.Map<String, String> updates) {
        String statusStr = updates.get("clientStatus");
        com.avo.entities.ClientStatus status = com.avo.entities.ClientStatus.valueOf(statusStr);
        return ResponseEntity.ok(service.updateStatus(id, status));
    }

    
}
