package com.avo.controller;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    private final com.avo.config.SecurityUtils securityUtils;

    public InvoiceController(InvoiceService service, ReportingService reportingService, com.avo.config.SecurityUtils securityUtils) {
        this.service = service;
        this.reportingService = reportingService;
        this.securityUtils = securityUtils;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<InvoiceDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<InvoiceDTO>> search(
            @QuerydslPredicate(root = Invoice.class) Predicate predicate,
            Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'ASSOCIE') or @securityUtils.canAccessInvoice(#id)")
    public ResponseEntity<InvoiceDTO> getById(@PathVariable Long id) {
        InvoiceDTO result = service.findById(id);
        if (result != null) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'ASSOCIE', 'AVOCAT', 'SECRETARIAT')")
    public ResponseEntity<InvoiceDTO> create(@Valid @RequestBody InvoiceDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping(value = {"", "/{id}"})
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'ASSOCIE', 'SECRETARIAT') or @securityUtils.canAccessInvoice(#dto.id != null ? #dto.id : #id)")
    public ResponseEntity<InvoiceDTO> update(@PathVariable(required = false) Long id, @Valid @RequestBody InvoiceDTO dto) {
        if (id != null && dto.getId() == null) {
            dto.setId(id);
        }
        return ResponseEntity.ok(service.update(dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'ASSOCIE') or @securityUtils.canAccessInvoice(#id)")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'ASSOCIE', 'SECRETARIAT') or @securityUtils.canAccessInvoice(#id)")
    public ResponseEntity<byte[]> generatePdf(@PathVariable Long id) {
        byte[] pdfBytes = reportingService.generateInvoicePdf(id);
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("inline", "facture_" + id + ".pdf");
        return new ResponseEntity<>(pdfBytes, headers, org.springframework.http.HttpStatus.OK);
    }

    @GetMapping("/bulk-pdf")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> generateBulkPdf(@RequestParam java.util.List<Long> ids) {
        if (ids != null && !ids.isEmpty()) {
            for (Long id : ids) {
                if (!securityUtils.canAccessInvoice(id)) {
                    throw new org.springframework.security.access.AccessDeniedException(
                        "Accès refusé : vous n'avez pas les droits pour accéder à la facture #" + id);
                }
            }
        }
        byte[] pdfBytes = reportingService.generateBulkInvoicePdf(ids);
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("inline", "factures_selection.pdf");
        return new ResponseEntity<>(pdfBytes, headers, org.springframework.http.HttpStatus.OK);
    }
}


