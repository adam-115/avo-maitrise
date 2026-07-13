package com.avo.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.avo.dtos.InvoiceDTO;
import com.avo.entities.Invoice;
import com.avo.services.InvoiceService;
import com.avo.services.ReportingService;
import com.querydsl.core.types.Predicate;

@RestController
@RequestMapping("/api/invoice")
public class InvoiceController {

    private final InvoiceService service;
    private final ReportingService reportingService;

    public InvoiceController(InvoiceService service, ReportingService reportingService) {
        this.service = service;
        this.reportingService = reportingService;
    }

    @GetMapping
    public ResponseEntity<Page<InvoiceDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<InvoiceDTO>> search(
            @QuerydslPredicate(root = Invoice.class) Predicate predicate,
            Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceDTO> getById(@PathVariable Long id) {
        InvoiceDTO result = service.findById(id);
        if (result != null) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<InvoiceDTO> create(@RequestBody InvoiceDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping
    public ResponseEntity<InvoiceDTO> update(@RequestBody InvoiceDTO dto) {
        return ResponseEntity.ok(service.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> generatePdf(@PathVariable Long id) {
        byte[] pdfBytes = reportingService.generateInvoicePdf(id);
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("inline", "facture_" + id + ".pdf");
        return new ResponseEntity<>(pdfBytes, headers, org.springframework.http.HttpStatus.OK);
    }
}
