package com.avo.controller;

import com.avo.services.BillingDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard/billing")
public class BillingDashboardController {

    private final BillingDashboardService billingDashboardService;

    public BillingDashboardController(BillingDashboardService billingDashboardService) {
        this.billingDashboardService = billingDashboardService;
    }

    @GetMapping("/active-clients-count")
    public ResponseEntity<Map<String, Long>> getActiveClientsCount() {
        long count = billingDashboardService.getActiveClientsCount();
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/active-dossiers-count")
    public ResponseEntity<Map<String, Long>> getActiveDossiersCount() {
        long count = billingDashboardService.getActiveDossiersCount();
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/unbilled-minutes")
    public ResponseEntity<Map<String, Long>> getUnbilledMinutes(
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.util.Date startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.util.Date endDate) {
        long count = billingDashboardService.getUnbilledMinutes(startDate, endDate);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/billed-minutes")
    public ResponseEntity<Map<String, Long>> getBilledMinutes(
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.util.Date startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.util.Date endDate) {
        long count = billingDashboardService.getBilledMinutes(startDate, endDate);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/unbilled-amounts")
    public ResponseEntity<Map<String, Double>> getUnbilledAmounts(
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.util.Date startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.util.Date endDate) {
        double ht = billingDashboardService.getUnbilledAmountHT(startDate, endDate);
        double ttc = billingDashboardService.getUnbilledAmountTTC(startDate, endDate);
        return ResponseEntity.ok(Map.of("ht", ht, "ttc", ttc));
    }

    @GetMapping("/billed-amounts")
    public ResponseEntity<Map<String, Double>> getBilledAmounts(
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.util.Date startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.util.Date endDate) {
        double ht = billingDashboardService.getBilledAmountHT(startDate, endDate);
        double ttc = billingDashboardService.getBilledAmountTTC(startDate, endDate);
        return ResponseEntity.ok(Map.of("ht", ht, "ttc", ttc));
    }

    @GetMapping("/pending-minutes")
    public ResponseEntity<Map<String, Long>> getPendingMinutes(
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.util.Date startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.util.Date endDate) {
        long count = billingDashboardService.getPendingMinutes(startDate, endDate);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/pending-amounts")
    public ResponseEntity<Map<String, Double>> getPendingAmounts(
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.util.Date startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.util.Date endDate) {
        double ht = billingDashboardService.getPendingAmountHT(startDate, endDate);
        double ttc = billingDashboardService.getPendingAmountTTC(startDate, endDate);
        return ResponseEntity.ok(Map.of("ht", ht, "ttc", ttc));
    }

    @GetMapping("/cancelled-minutes")
    public ResponseEntity<Map<String, Long>> getCancelledMinutes(
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.util.Date startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.util.Date endDate) {
        long count = billingDashboardService.getCancelledMinutes(startDate, endDate);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/cancelled-amounts")
    public ResponseEntity<Map<String, Double>> getCancelledAmounts(
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.util.Date startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.util.Date endDate) {
        double ht = billingDashboardService.getCancelledAmountHT(startDate, endDate);
        double ttc = billingDashboardService.getCancelledAmountTTC(startDate, endDate);
        return ResponseEntity.ok(Map.of("ht", ht, "ttc", ttc));
    }

    @GetMapping("/unbilled-by-dossier")
    public ResponseEntity<java.util.List<com.avo.dtos.UnbilledDossierSummaryDTO>> getUnbilledByDossier(
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.util.Date startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.util.Date endDate) {
        return ResponseEntity.ok(billingDashboardService.getUnbilledDossiersSummary(startDate, endDate));
    }

    @GetMapping("/debug-statuses")
    public ResponseEntity<java.util.List<String>> debugStatuses(
        @org.springframework.beans.factory.annotation.Autowired com.avo.repositories.InvoiceDossierServiceRepository repo) {
        java.util.List<String> statuses = repo.findAll().stream()
            .map(s -> s.getId() + " - " + s.getStatus() + " - mins: " + s.getNbrOfMinutes())
            .toList();
        return ResponseEntity.ok(statuses);
    }
}
