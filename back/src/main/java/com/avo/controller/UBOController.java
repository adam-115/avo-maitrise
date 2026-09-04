package com.avo.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.avo.dtos.UBODTO;
import com.avo.entities.UBO;
import com.avo.services.UBOService;
import com.querydsl.core.types.Predicate;

@RestController
@RequestMapping("/api/ubos")
public class UBOController {

    private final UBOService service;
    private final com.avo.services.ReportingService reportingService;

    public UBOController(UBOService service, com.avo.services.ReportingService reportingService) {
        this.service = service;
        this.reportingService = reportingService;
    }

    @GetMapping("/aml-report/pdf")
    public ResponseEntity<byte[]> generateAmlReportPdf(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        byte[] pdfBytes = reportingService.generateGlobalUboAmlReport(startDate, endDate);
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "audit_lcb_ft_ubos_" + java.time.LocalDate.now() + ".pdf");
        return ResponseEntity.ok().headers(headers).body(pdfBytes);
    }

    @GetMapping
    public ResponseEntity<Page<UBODTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<UBODTO>> search(@QuerydslPredicate(root = UBO.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UBODTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<UBODTO> create(@RequestBody UBODTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping(value = {"", "/{id}"})
    public ResponseEntity<UBODTO> update(@PathVariable(required = false) Long id, @RequestBody UBODTO dto) {
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
