package com.avo.controller;

import com.avo.dtos.conflict.ConflictCheckDTOs.*;
import com.avo.services.conflict.ConflictCheckService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * API REST de vérification déontologique des conflits d'intérêts.
 */
@RestController
@RequestMapping("/api/conflicts")
public class ConflictCheckController {

    private final ConflictCheckService conflictCheckService;

    public ConflictCheckController(ConflictCheckService conflictCheckService) {
        this.conflictCheckService = conflictCheckService;
    }

    @PostMapping("/check")
    public ResponseEntity<CheckResponse> check(@RequestBody CheckRequest request) {
        return ResponseEntity.ok(conflictCheckService.checkConflicts(request));
    }

    @PostMapping("/record")
    public ResponseEntity<?> record(@RequestBody RecordRequest request) {
        try {
            return ResponseEntity.ok(conflictCheckService.recordCheck(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/dossier/{dossierId}")
    public ResponseEntity<List<HistoryItem>> history(@PathVariable Long dossierId) {
        return ResponseEntity.ok(conflictCheckService.getDossierHistory(dossierId));
    }

    @PostMapping("/dossier/{dossierId}/recheck")
    public ResponseEntity<CheckResponse> recheckDossier(@PathVariable Long dossierId) {
        return ResponseEntity.ok(conflictCheckService.checkExistingDossier(dossierId));
    }
}
