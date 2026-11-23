package com.avo.controller;

import com.avo.dtos.DossierDeadlineDTO;
import com.avo.entities.DeadlineRule;
import com.avo.job.DeadlineAlertJob;
import com.avo.services.deadline.DeadlineExtractionAiService;
import com.avo.services.deadline.DossierDeadlineService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Points d'entrée REST pour le calcul déterministe et le suivi des délais de procédure
 * (appel, prescription, péremption, pourvoi, conclusions).
 */
@RestController
@RequestMapping("/api/deadlines")
public class DeadlineController {

    private final DossierDeadlineService deadlineService;
    private final DeadlineExtractionAiService extractionAiService;
    private final DeadlineAlertJob alertJob;

    public DeadlineController(DossierDeadlineService deadlineService,
                              DeadlineExtractionAiService extractionAiService,
                              DeadlineAlertJob alertJob) {
        this.deadlineService = deadlineService;
        this.extractionAiService = extractionAiService;
        this.alertJob = alertJob;
    }

    @GetMapping("/rules")
    public ResponseEntity<List<DeadlineRule>> getRules(@RequestParam(required = false) String pays) {
        return ResponseEntity.ok(deadlineService.getRules(pays));
    }

    @PostMapping("/rules")
    public ResponseEntity<DeadlineRule> saveRule(@RequestBody DeadlineRule rule) {
        return ResponseEntity.ok(deadlineService.saveRule(rule));
    }

    @DeleteMapping("/rules/{id}")
    public ResponseEntity<Void> deleteRule(@PathVariable Long id) {
        deadlineService.deleteRule(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/dossier/{dossierId}")
    public ResponseEntity<List<DossierDeadlineDTO>> findByDossier(@PathVariable Long dossierId) {
        return ResponseEntity.ok(deadlineService.findByDossier(dossierId));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<DossierDeadlineDTO>> findUpcoming(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(deadlineService.findUpcomingCritical(days));
    }

    @PostMapping("/preview")
    public ResponseEntity<DossierDeadlineDTO> preview(@RequestBody DossierDeadlineDTO request) {
        return ResponseEntity.ok(deadlineService.preview(request));
    }

    @PostMapping
    public ResponseEntity<DossierDeadlineDTO> create(@RequestBody DossierDeadlineDTO request) {
        return ResponseEntity.ok(deadlineService.create(request));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<DossierDeadlineDTO> complete(@PathVariable Long id,
                                                       @RequestBody(required = false) Map<String, String> body) {
        String justificatif = body != null ? body.get("justificatif") : null;
        return ResponseEntity.ok(deadlineService.markCompleted(id, justificatif));
    }

    @PostMapping("/{id}/interrupt")
    public ResponseEntity<DossierDeadlineDTO> interrupt(@PathVariable Long id,
                                                        @RequestBody(required = false) Map<String, Object> body) {
        LocalDate date = null;
        if (body != null && body.get("dateInterruption") != null && !String.valueOf(body.get("dateInterruption")).isBlank()) {
            date = LocalDate.parse(String.valueOf(body.get("dateInterruption")));
        }
        String motif = body != null && body.get("motif") != null ? String.valueOf(body.get("motif")) : null;
        boolean relancer = body != null && Boolean.TRUE.equals(body.get("relancer"));
        return ResponseEntity.ok(deadlineService.interrupt(id, date, motif, relancer));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        deadlineService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Phase 3 (IA) : extrait les dates déclencheuses depuis une pièce du dossier,
     * puis calcule les propositions de délais via le moteur déterministe Java (à valider par l'avocat).
     */
    @PostMapping("/dossier/{dossierId}/detect-from-document/{documentId}")
    public ResponseEntity<List<DossierDeadlineDTO>> detectFromDocument(@PathVariable Long dossierId,
                                                                       @PathVariable Long documentId) {
        return ResponseEntity.ok(extractionAiService.detectDeadlinesFromDocument(dossierId, documentId));
    }

    /** Déclenchement manuel de la vérification des alertes RCP (utile en test/administration). */
    @PostMapping("/run-alerts")
    public ResponseEntity<Map<String, String>> triggerAlerts() {
        alertJob.checkProceduralDeadlines();
        return ResponseEntity.ok(Map.of("result", "Vérification des alertes de délais exécutée."));
    }
}
