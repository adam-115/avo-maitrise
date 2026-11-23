package com.avo.controller;

import com.avo.entities.ActTemplate;
import com.avo.services.acts.ActGenerationService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * Points d'entrée REST pour les modèles d'actes et la génération automatique
 * (contrats, mises en demeure, assignations, requêtes, bordereaux de pièces).
 */
@RestController
@RequestMapping("/api/acts")
public class ActController {

    private final ActGenerationService actService;

    public ActController(ActGenerationService actService) {
        this.actService = actService;
    }

    @GetMapping("/templates")
    public ResponseEntity<List<ActTemplate>> listTemplates(
            @RequestParam(required = false) String pays,
            @RequestParam(required = false) String categorie) {
        return ResponseEntity.ok(actService.listTemplates(pays, categorie));
    }

    @PostMapping("/templates")
    public ResponseEntity<ActTemplate> createTemplate(@RequestBody Map<String, Object> body) {
        ActTemplate tpl = new ActTemplate();
        if (body.get("id") instanceof Number n) tpl.setId(n.longValue());
        tpl.setCode(str(body.get("code")));
        tpl.setTitre(str(body.get("titre")));
        tpl.setCategorie(strOrDefault(body.get("categorie"), "COURRIER"));
        tpl.setPays(strOrDefault(body.get("pays"), "FRANCE"));
        tpl.setDescription(str(body.get("description")));
        tpl.setFormat(strOrDefault(body.get("format"), "TEXT_TEMPLATE"));
        tpl.setContent(str(body.get("content")));
        tpl.setNomFichier(str(body.get("nomFichier")));
        tpl.setActive(true);
        String docxBase64 = str(body.get("fileData"));
        return ResponseEntity.ok(actService.saveTemplate(tpl, docxBase64));
    }

    @DeleteMapping("/templates/{id}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Long id) {
        actService.deleteTemplate(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/variables/{dossierId}")
    public ResponseEntity<Map<String, String>> getVariables(@PathVariable Long dossierId) {
        return ResponseEntity.ok(actService.getVariablesForDossier(dossierId));
    }

    @SuppressWarnings("unchecked")
    @PostMapping("/preview")
    public ResponseEntity<Map<String, Object>> preview(@RequestBody Map<String, Object> body) {
        Long templateId = ((Number) body.get("templateId")).longValue();
        Long dossierId = ((Number) body.get("dossierId")).longValue();
        Map<String, String> values = (Map<String, String>) body.get("values");
        return ResponseEntity.ok(actService.preview(templateId, dossierId, values));
    }

    @SuppressWarnings("unchecked")
    @PostMapping("/generate")
    public ResponseEntity<byte[]> generate(@RequestBody Map<String, Object> body) {
        Long templateId = ((Number) body.get("templateId")).longValue();
        Long dossierId = ((Number) body.get("dossierId")).longValue();
        String customTitle = str(body.get("customTitle"));
        String editedContent = str(body.get("editedContent"));
        Map<String, String> values = (Map<String, String>) body.get("values");
        boolean saveToDossier = !Boolean.FALSE.equals(body.get("saveToDossier"));

        ActGenerationService.GeneratedActResult result = actService.generateDocx(
                templateId, dossierId, customTitle, editedContent, values, saveToDossier);

        String encoded = URLEncoder.encode(result.filename(), StandardCharsets.UTF_8).replace("+", "%20");
        var builder = ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + result.filename() + "\"; filename*=UTF-8''" + encoded)
                .header("X-Saved-Document-Id", result.savedDocumentId() != null ? String.valueOf(result.savedDocumentId()) : "")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
        return builder.body(result.docxBytes());
    }

    @PostMapping("/enhance-with-ai")
    public ResponseEntity<Map<String, String>> enhanceWithAi(@RequestBody Map<String, Object> body) {
        Long dossierId = ((Number) body.get("dossierId")).longValue();
        String draftText = str(body.get("draftText"));
        String instruction = str(body.get("instruction"));
        String enhanced = actService.enhanceWithAi(dossierId, draftText, instruction);
        return ResponseEntity.ok(Map.of("result", enhanced));
    }

    private static String str(Object o) {
        return o == null ? null : String.valueOf(o);
    }

    private static String strOrDefault(Object o, String def) {
        String s = str(o);
        return (s == null || s.isBlank()) ? def : s;
    }
}
