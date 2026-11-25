package com.avo.controller;

import com.avo.services.voice.VoiceNoteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * API REST pour la dictée vocale rapide (suggestion automatique de dossier + structuration IA optionnelle).
 */
@RestController
@RequestMapping("/api/voice-notes")
public class VoiceNoteController {

    private final VoiceNoteService voiceNoteService;

    public VoiceNoteController(VoiceNoteService voiceNoteService) {
        this.voiceNoteService = voiceNoteService;
    }

    public record TranscriptRequest(String transcript, Long dossierId) {}

    @PostMapping("/suggest-dossier")
    public ResponseEntity<?> suggestDossier(@RequestBody TranscriptRequest req) {
        VoiceNoteService.DossierSuggestion suggestion = voiceNoteService.suggestDossierFromTranscript(
                req != null ? req.transcript() : null);
        if (suggestion == null) {
            return ResponseEntity.ok(Map.of("found", false));
        }
        return ResponseEntity.ok(Map.of("found", true, "suggestion", suggestion));
    }

    @PostMapping("/structure")
    public ResponseEntity<?> structure(@RequestBody TranscriptRequest req) {
        try {
            return ResponseEntity.ok(voiceNoteService.structureTranscript(
                    req != null ? req.transcript() : null,
                    req != null ? req.dossierId() : null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
