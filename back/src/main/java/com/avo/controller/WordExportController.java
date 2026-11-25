package com.avo.controller;

import com.avo.services.export.WordExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * API REST d'export Microsoft Word (.docx) pour la Stratégie IA, la Discussion IA et les Notes de dossier.
 */
@RestController
@RequestMapping("/api/export/word")
public class WordExportController {

    private static final MediaType DOCX_MEDIA_TYPE =
            MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");

    private final WordExportService wordExportService;

    public WordExportController(WordExportService wordExportService) {
        this.wordExportService = wordExportService;
    }

    @GetMapping("/dossier/{dossierId}/strategie")
    public ResponseEntity<?> exportStrategy(@PathVariable Long dossierId) {
        try {
            WordExportService.ExportedDocx file = wordExportService.exportDossierStrategy(dossierId);
            return docxResponse(file);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/dossier/{dossierId}/chat")
    public ResponseEntity<?> exportChat(@PathVariable Long dossierId) {
        try {
            WordExportService.ExportedDocx file = wordExportService.exportDossierChat(dossierId);
            return docxResponse(file);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/note/{noteId}")
    public ResponseEntity<?> exportNote(@PathVariable Long noteId) {
        try {
            WordExportService.ExportedDocx file = wordExportService.exportNote(noteId);
            return docxResponse(file);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    private ResponseEntity<byte[]> docxResponse(WordExportService.ExportedDocx file) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.filename() + "\"")
                .contentType(DOCX_MEDIA_TYPE)
                .body(file.bytes());
    }
}
