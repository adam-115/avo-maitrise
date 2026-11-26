package com.avo.controller;

import com.avo.repositories.DocumentRepository;
import com.avo.repositories.DossierRepository;
import com.avo.service.AiService;
import com.avo.service.ai.AvoAiTools;
import com.avo.service.ai.RAGDocumentService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
import java.util.List;

/**
 * Points d'entrée REST de l'intelligence artificielle (préfixe {@code /api/ai}).
 *
 * <p>Ce contrôleur ne contient pas de logique d'IA : il valide les paramètres reçus du front, délègue le
 * travail à {@link AiService} (appel du modèle configuré dans l'écran d'administration) ou à
 * {@link RAGDocumentService} (indexation des documents dans Qdrant), puis met en forme la réponse JSON.</p>
 *
 * <p>Les réponses de l'assistant ({@code /chat} et {@code /analyze}) contiennent, en plus du texte
 * ({@code result}), les sources consultées par l'IA ({@code sources}) et le verdict de la vérification
 * automatique des citations ({@code verification}).</p>
 */
@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;
    private final DocumentRepository documentRepository;
    private final RAGDocumentService ragDocumentService;
    private final AvoAiTools avoAiTools;
    private final DossierRepository dossierRepository;

    /**
     * Injection des dépendances par constructeur (Spring).
     *
     * @param aiService          service qui appelle le modèle d'IA (résumé, rédaction, chat, stratégie)
     * @param documentRepository accès aux documents, utilisé pour la resynchronisation complète de Qdrant
     * @param ragDocumentService indexation des documents dans la base vectorielle (RAG)
     * @param avoAiTools         outils mis à disposition de l'IA (clients, dossiers, jurisprudence...)
     * @param dossierRepository  accès aux dossiers, utilisé pour effacer l'historique du chat d'un dossier
     */
    public AiController(AiService aiService,
            DocumentRepository documentRepository,
            RAGDocumentService ragDocumentService,
            AvoAiTools avoAiTools,
            DossierRepository dossierRepository) {
        this.aiService = aiService;
        this.documentRepository = documentRepository;
        this.ragDocumentService = ragDocumentService;
        this.avoAiTools = avoAiTools;
        this.dossierRepository = dossierRepository;
    }

    /**
     * Résume un texte libre.
     *
     * <p>{@code POST /api/ai/summarize} — corps attendu : {@code {"text": "..."}}.</p>
     *
     * @param request corps de la requête contenant le texte à résumer (clé {@code text})
     * @return {@code 200} avec {@code {"result": "<résumé>"}}, ou {@code 400} si le texte est absent ou vide
     */
    @PostMapping("/summarize")
    public ResponseEntity<Map<String, String>> summarize(@RequestBody Map<String, String> request) {
        String text = request.get("text");
        if (text == null || text.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Le texte ne peut pas être vide"));
        }
        String summary = aiService.summarizeText(text);
        return ResponseEntity.ok(Map.of("result", summary));
    }

    /**
     * Rédige un brouillon de document juridique (mise en demeure, courrier, contrat...).
     *
     * <p>{@code POST /api/ai/draft} — corps attendu : {@code {"context": "...", "documentType": "..."}}.</p>
     *
     * @param request corps de la requête : le contexte de l'affaire ({@code context}) et le type de document
     *                à produire ({@code documentType})
     * @return {@code 200} avec {@code {"result": "<brouillon>"}}, ou {@code 400} si un des deux champs manque
     */
    @PostMapping("/draft")
    public ResponseEntity<Map<String, String>> draft(@RequestBody Map<String, String> request) {
        String context = request.get("context");
        String documentType = request.get("documentType");
        if (context == null || documentType == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Les champs 'context' et 'documentType' sont obligatoires"));
        }
        String draft = aiService.draftDocument(context, documentType);
        return ResponseEntity.ok(Map.of("result", draft));
    }

    /**
     * Chat libre avec l'assistant du cabinet (mode « Chat Libre » de l'écran Assistant IA).
     *
     * <p>{@code POST /api/ai/chat} — corps attendu : {@code {"message": "...", "sessionId": "...", "pays": "LUXEMBOURG"}}.
     * {@code pays} est le droit applicable choisi par l'avocat : la jurisprudence n'est cherchée que dans ce pays
     * et à l'international (facultatif : détecté dans la question, sinon FRANCE).
     * Le modèle peut appeler les outils internes (clients, dossiers, factures, alertes LCB-FT...) ; chaque donnée
     * lue est inscrite comme source citable [S1], [S2]... La conversation est mémorisée par utilisateur et par
     * {@code sessionId} (20 derniers messages).</p>
     *
     * @param request corps de la requête : la question ({@code message}) et l'identifiant de conversation
     *                ({@code sessionId}, facultatif : {@code default-session} par défaut)
     * @return {@code 200} avec {@code result} (réponse), {@code sources} (sources consultées) et
     *         {@code verification} (verdict du contrôle automatique) et {@code perimetre} (droit consulté), ou {@code 400} si le message est vide
     */
    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        String sessionId = request.getOrDefault("sessionId", "default-session");

        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Le message ne peut pas être vide"));
        }
        // « result » + « sources » consultées + « verification » (verdict du contrôle automatique)
        // « pays » : droit applicable choisi dans l'écran (facultatif : détecté dans la question, sinon FRANCE)
        return ResponseEntity.ok(aiService.chat(sessionId, message, request.get("pays")).toBody());
    }

    /**
     * Questions de suivi sur la stratégie d'un dossier (chat de la « Console Stratégique »).
     *
     * <p>{@code POST /api/ai/chat-dossier} — corps attendu :
     * {@code {"dossierId": 12, "history": [{"role": "user"|"ai", "content": "..."}]}}.
     * La stratégie déjà générée pour le dossier sert de contexte ; la réponse est ajoutée à l'historique
     * enregistré dans le dossier.</p>
     *
     * @param request corps de la requête : l'identifiant du dossier ({@code dossierId}) et l'historique complet
     *                de la conversation ({@code history}), dernier message de l'utilisateur compris
     * @return {@code 200} avec {@code {"result": "<réponse>"}}, ou {@code 400} si l'historique est vide ou si
     *         le dossier n'est pas précisé
     */
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

    /**
     * Analyse juridique par l'« Avocat Assistant » (mode « Avocat Assistant (Stratégie) » de l'écran Assistant IA).
     *
     * <p>{@code POST /api/ai/analyze} — corps attendu : {@code {"message": "...", "sessionId": "...", "pays": "LUXEMBOURG"}}.
     * {@code pays} est le droit applicable choisi par l'avocat : la jurisprudence n'est cherchée que dans ce pays
     * et à l'international (facultatif : détecté dans la question, sinon FRANCE).
     * Avant d'appeler le modèle, le logiciel recherche lui-même la jurisprudence du cabinet pertinente (pays
     * détecté dans la question, France par défaut) et la joint à la question : la réponse s'appuie ainsi
     * toujours sur des sources réelles, que le modèle doit citer. Les références juridiques de la réponse
     * (pourvois, articles, ECLI, décisions datées) sont ensuite vérifiées automatiquement.</p>
     *
     * @param request corps de la requête : la question ({@code message}) et l'identifiant de conversation
     *                ({@code sessionId}, facultatif)
     * @return {@code 200} avec {@code result}, {@code sources} et {@code verification}, ou {@code 400} si le
     *         message est vide
     */
    @PostMapping("/analyze")
    public ResponseEntity<Map<String, Object>> analyze(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        String sessionId = request.getOrDefault("sessionId", "default-session");

        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Le message ne peut pas être vide"));
        }
        return ResponseEntity.ok(aiService.analyzeDossierStrategy(sessionId, message, request.get("pays")).toBody());
    }

    /**
     * Génère l'analyse stratégique complète d'un dossier, en flux continu (Server-Sent Events).
     *
     * <p>{@code GET /api/ai/analyze-stream?dossierId=12} — utilisé par la « Console Stratégique ».
     * Le texte arrive au fur et à mesure de sa génération ; les événements envoyés sont :</p>
     * <ul>
     *   <li>événements sans nom : un morceau de texte au format {@code {"token": "..."}} ;</li>
     *   <li>{@code SOURCES} : les sources consultées et le verdict de vérification de l'analyse complète ;</li>
     *   <li>{@code PAYS_MANQUANT} : le pays de juridiction du dossier n'est pas défini, l'analyse n'est pas lancée ;</li>
     *   <li>{@code DONE} : fin du flux.</li>
     * </ul>
     * <p>L'analyse terminée est enregistrée dans le dossier.</p>
     *
     * @param dossierId identifiant du dossier à analyser
     * @return l'émetteur SSE, ouvert 15 minutes au maximum (le temps de génération sur un serveur sans GPU)
     */
    @GetMapping(value = "/analyze-stream", produces = "text/event-stream;charset=UTF-8")
    public SseEmitter analyzeStream(
            @RequestParam("dossierId") Long dossierId) {
        // Timeout de 15 minutes (900000 ms) pour laisser le temps à l'IA
        SseEmitter emitter = new SseEmitter(900000L);
        aiService.analyzeDossierStrategyStream(dossierId, emitter);
        return emitter;
    }

    /**
     * Réindexe tous les documents du cabinet dans la base vectorielle Qdrant (RAG).
     *
     * <p>{@code POST /api/ai/sync-all-documents} — à lancer après un changement de modèle d'embeddings ou une
     * évolution de l'indexation (par exemple l'ajout des numéros de page), pour que l'IA retrouve tous les
     * documents à jour. Seuls les documents ayant un fichier stocké dans MinIO sont traités ; un document en
     * échec est ignoré sans interrompre les autres. L'opération est synchrone et peut être longue.</p>
     *
     * @return {@code 200} avec le nombre de documents réindexés avec succès
     */
    @PostMapping("/sync-all-documents")
    public ResponseEntity<Map<String, String>> syncAllDocuments() {
        java.util.List<com.avo.entities.Document> allDocs = documentRepository.findAll();
        int count = 0;
        for (com.avo.entities.Document doc : allDocs) {
            if (doc.getMinioObjectId() != null && !doc.getMinioObjectId().isBlank()) {
                try {
                    ragDocumentService.ingestDocumentIntoQdrantSync(doc.getId());
                    count++;
                } catch (Exception e) {
                    System.err.println("Failed to sync document " + doc.getId() + ": " + e.getMessage());
                }
            }
        }
        return ResponseEntity
                .ok(Map.of("result", "Synchronisation terminée avec succès pour " + count + " documents."));
    }

    /**
     * Efface l'historique du chat de stratégie d'un dossier (bouton « effacer » de la Console Stratégique).
     *
     * <p>{@code DELETE /api/ai/dossier/{dossierId}/chat} — l'analyse stratégique elle-même est conservée,
     * seules les questions de suivi et leurs réponses sont supprimées.</p>
     *
     * @param dossierId identifiant du dossier
     * @return {@code 200} si l'historique a été effacé, {@code 404} si le dossier n'existe pas
     */
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
