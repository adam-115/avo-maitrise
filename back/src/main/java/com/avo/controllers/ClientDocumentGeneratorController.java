package com.avo.controllers;

import com.avo.services.documents.ClientDocumentGeneratorService;
import com.avo.services.documents.ClientDocumentGeneratorService.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/client-documents")
public class ClientDocumentGeneratorController {

    private static final MediaType DOCX_MEDIA_TYPE = MediaType.parseMediaType(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    public record SearchModelsRequest(Long clientId, Long dossierId, String prompt) {}

    public record GenerateDocumentRequest(
            Long clientId,
            Long dossierId,
            Long modelDocumentId,
            String instructions,
            Boolean saveToClientGed
    ) {}

    private final ClientDocumentGeneratorService generatorService;

    public ClientDocumentGeneratorController(ClientDocumentGeneratorService generatorService) {
        this.generatorService = generatorService;
    }

    @PostMapping("/search-models")
    public ResponseEntity<ModelSearchResult> searchModels(@RequestBody SearchModelsRequest request) {
        String prompt = request != null ? request.prompt() : "";
        return ResponseEntity.ok(generatorService.searchModels(prompt));
    }

    @PostMapping("/generate")
    public ResponseEntity<byte[]> generateDocument(@RequestBody GenerateDocumentRequest request) {
        if (request == null || (request.clientId() == null && request.dossierId() == null) || request.modelDocumentId() == null) {
            return ResponseEntity.badRequest().build();
        }
        boolean saveGed = Boolean.TRUE.equals(request.saveToClientGed());
        GeneratedDocumentResult result = generatorService.generateDocument(
                request.clientId(),
                request.dossierId(),
                request.modelDocumentId(),
                request.instructions(),
                saveGed
        );

        String encodedName = URLEncoder.encode(result.filename(), StandardCharsets.UTF_8).replace("+", "%20");
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(DOCX_MEDIA_TYPE);
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + result.filename() + "\"; filename*=UTF-8''" + encodedName);
        headers.set("X-Generation-Mode", result.generationMode());
        if (result.archivedDocumentId() != null) {
            headers.set("X-Archived-Document-Id", String.valueOf(result.archivedDocumentId()));
        }
        headers.set(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, "Content-Disposition, X-Archived-Document-Id, X-Generation-Mode");

        return ResponseEntity.ok().headers(headers).body(result.docxBytes());
    }
}
