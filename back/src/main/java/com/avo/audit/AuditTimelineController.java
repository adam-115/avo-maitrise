package com.avo.audit;

import com.avo.audit.timeline.AuditPdfService;
import com.avo.audit.timeline.AuditSearchService;
import com.avo.audit.timeline.AuditTimelineService;
import com.avo.audit.timeline.TimelineEntry;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Consultation du journal d'audit (administrateurs uniquement, voir SecurityConfig) :
 * chronologie d'un client ou d'un dossier, export PDF pour le bâtonnier, recherche et alertes.
 * Chaque consultation du journal est elle-même tracée.
 */
@RestController
@RequestMapping("/api/audit")
public class AuditTimelineController {

    private final AuditTimelineService timelineService;
    private final AuditPdfService pdfService;
    private final AuditSearchService searchService;

    public AuditTimelineController(AuditTimelineService timelineService, AuditPdfService pdfService,
            AuditSearchService searchService) {
        this.timelineService = timelineService;
        this.pdfService = pdfService;
        this.searchService = searchService;
    }

    @AuditAccess(action = AuditAction.CONSULTATION, resource = "JOURNAL_AUDIT", details = "Chronologie d'audit")
    @GetMapping("/timeline")
    public ResponseEntity<List<TimelineEntry>> timeline(@RequestParam String scope, @RequestParam Long id) {
        return ResponseEntity.ok(timelineService.timeline(checkScope(scope), id));
    }

    @AuditAccess(action = AuditAction.EXPORT, resource = "JOURNAL_AUDIT", details = "Journal d'audit (PDF)")
    @GetMapping("/timeline/pdf")
    public ResponseEntity<byte[]> timelinePdf(@RequestParam String scope, @RequestParam Long id) {
        String checked = checkScope(scope);
        byte[] pdf = pdfService.generate(checked, id);
        String filename = "journal-audit-" + checked.toLowerCase() + "-" + id + "-"
                + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmm")) + ".pdf";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @AuditAccess(action = AuditAction.CONSULTATION, resource = "JOURNAL_AUDIT", idParam = "", details = "Recherche des accès")
    @GetMapping("/access")
    public ResponseEntity<AuditSearchService.PageResult<AuditSearchService.AccessRow>> searchAccess(
            @RequestParam(required = false) String user,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) String resourceId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(searchService.searchAccess(user, action, resourceType, resourceId, from, to,
                Math.max(page, 0), clampSize(size)));
    }

    @AuditAccess(action = AuditAction.CONSULTATION, resource = "JOURNAL_AUDIT", idParam = "", details = "Recherche des modifications")
    @GetMapping("/revisions")
    public ResponseEntity<AuditSearchService.PageResult<AuditSearchService.RevisionRow>> searchRevisions(
            @RequestParam(required = false) String user,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(searchService.searchRevisions(user, from, to, Math.max(page, 0), clampSize(size)));
    }

    @AuditAccess(action = AuditAction.CONSULTATION, resource = "JOURNAL_AUDIT", idParam = "", details = "Alertes")
    @GetMapping("/alerts")
    public ResponseEntity<AuditSearchService.AlertsReport> alerts(@RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(searchService.alerts(Math.min(Math.max(days, 1), 90)));
    }

    private static String checkScope(String scope) {
        String s = scope == null ? "" : scope.trim().toUpperCase();
        if (!s.equals("CLIENT") && !s.equals("DOSSIER")) {
            throw new IllegalArgumentException("scope doit valoir CLIENT ou DOSSIER");
        }
        return s;
    }

    private static int clampSize(int size) {
        return Math.min(Math.max(size, 1), 200);
    }
}
