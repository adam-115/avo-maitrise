package com.avo.controller;

import com.avo.service.AiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;
    private final com.avo.repositories.DocumentRepository documentRepository;
    private final com.avo.service.ai.RAGDocumentService ragDocumentService;
    private final com.avo.service.ai.AvoAiTools avoAiTools;
    private final com.avo.repositories.DossierRepository dossierRepository;

    public AiController(AiService aiService, 
                        com.avo.repositories.DocumentRepository documentRepository,
                        com.avo.service.ai.RAGDocumentService ragDocumentService,
                        com.avo.service.ai.AvoAiTools avoAiTools,
                        com.avo.repositories.DossierRepository dossierRepository) {
        this.aiService = aiService;
        this.documentRepository = documentRepository;
        this.ragDocumentService = ragDocumentService;
        this.avoAiTools = avoAiTools;
        this.dossierRepository = dossierRepository;
    }

    @PostMapping("/summarize")
    public ResponseEntity<Map<String, String>> summarize(@RequestBody Map<String, String> request) {
        String text = request.get("text");
        if (text == null || text.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Le texte ne peut pas être vide"));
        }
        String summary = aiService.summarizeText(text);
        return ResponseEntity.ok(Map.of("result", summary));
    }

    @PostMapping("/draft")
    public ResponseEntity<Map<String, String>> draft(@RequestBody Map<String, String> request) {
        String context = request.get("context");
        String documentType = request.get("documentType");
        if (context == null || documentType == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Les champs 'context' et 'documentType' sont obligatoires"));
        }
        String draft = aiService.draftDocument(context, documentType);
        return ResponseEntity.ok(Map.of("result", draft));
    }
    
    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        String sessionId = request.getOrDefault("sessionId", "default-session");
        
        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Le message ne peut pas être vide"));
        }
        String reply = aiService.chat(sessionId, message);
        return ResponseEntity.ok(Map.of("result", reply));
    }

    @PostMapping("/chat-dossier")
    public ResponseEntity<Map<String, String>> chatDossier(@RequestBody Map<String, Object> request) {
        List<Map<String, String>> history = (List<Map<String, String>>) request.get("history");
        Number dossierIdObj = (Number) request.get("dossierId");
        
        if (history == null || history.isEmpty() || dossierIdObj == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "L'historique et le dossierId sont obligatoires"));
        }
        
        Long dossierId = dossierIdObj.longValue();
        String reply = aiService.chatDossierStrategy(dossierId, history);
        return ResponseEntity.ok(Map.of("result", reply));
    }

    @PostMapping("/analyze")
    public ResponseEntity<Map<String, String>> analyze(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        String sessionId = request.getOrDefault("sessionId", "default-session");
        
        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Le message ne peut pas être vide"));
        }
        String reply = aiService.analyzeDossierStrategy(sessionId, message);
        return ResponseEntity.ok(Map.of("result", reply));
    }

    @GetMapping(value = "/analyze-stream", produces = "text/event-stream;charset=UTF-8")
    public org.springframework.web.servlet.mvc.method.annotation.SseEmitter analyzeStream(@RequestParam("dossierId") Long dossierId) {
        // Timeout de 15 minutes (900000 ms) pour laisser le temps à l'IA
        org.springframework.web.servlet.mvc.method.annotation.SseEmitter emitter = new org.springframework.web.servlet.mvc.method.annotation.SseEmitter(900000L); 
        aiService.analyzeDossierStrategyStream(dossierId, emitter);
        return emitter;
    }

    @PostMapping("/sync-all-documents")
    public ResponseEntity<Map<String, String>> syncAllDocuments() {
        java.util.List<com.avo.entities.Document> allDocs = documentRepository.findAll();
        int count = 0;
        for (com.avo.entities.Document doc : allDocs) {
            if (doc.getFileData() != null && doc.getFileData().length > 0) {
                try {
                    ragDocumentService.ingestDocumentIntoQdrantSync(doc.getId());
                    count++;
                } catch (Exception e) {
                    System.err.println("Failed to sync document " + doc.getId() + ": " + e.getMessage());
                }
            }
        }
        return ResponseEntity.ok(Map.of("result", "Synchronisation terminée avec succès pour " + count + " documents."));
    }

    @DeleteMapping("/dossier/{dossierId}/chat")
    public ResponseEntity<Map<String, String>> clearChatHistory(@PathVariable Long dossierId) {
        com.avo.entities.Dossier dossier = dossierRepository.findById(dossierId).orElse(null);
        if (dossier != null) {
            dossier.setAiChatHistory(null);
            dossierRepository.save(dossier);
            return ResponseEntity.ok(Map.of("result", "Historique supprimé"));
        }
        return ResponseEntity.notFound().build();
    }
}
