package com.avo.service.ai;

import dev.langchain4j.agent.tool.Tool;
import org.springframework.stereotype.Component;
import org.springframework.data.domain.PageRequest;

import com.avo.services.ClientService;
import com.avo.services.DossierService;

import java.util.stream.Collectors;

/**
 * Composant central contenant les "Outils" (Tools/Functions) mis à disposition
 * de l'Intelligence Artificielle.
 * Langchain4j scanne cette classe et fournit la description (annotation @Tool)
 * au LLM.
 * Le LLM peut alors décider d'appeler ces méthodes Java pour obtenir des
 * données de la base MySQL
 * ou interroger la base vectorielle Qdrant avant de répondre à l'utilisateur.
 */
@Component
public class AvoAiTools {

    private final ClientService clientService;
    private final DossierService dossierService;
    private final com.avo.services.InvoiceService invoiceService;
    private final com.avo.services.ScreeningMatchService screeningMatchService;
    private final com.avo.services.DocumentService documentService;
    private final AiDossierSummaryService aiDossierSummaryService;
    private final dev.langchain4j.store.embedding.EmbeddingStore<dev.langchain4j.data.segment.TextSegment> embeddingStore;
    private final dev.langchain4j.model.embedding.EmbeddingModel embeddingModel;

    public AvoAiTools(ClientService clientService, DossierService dossierService,
            com.avo.services.InvoiceService invoiceService,
            com.avo.services.ScreeningMatchService screeningMatchService,
            com.avo.services.DocumentService documentService,
            AiDossierSummaryService aiDossierSummaryService,
            dev.langchain4j.store.embedding.EmbeddingStore<dev.langchain4j.data.segment.TextSegment> embeddingStore,
            dev.langchain4j.model.embedding.EmbeddingModel embeddingModel) {
        this.clientService = clientService;
        this.dossierService = dossierService;
        this.invoiceService = invoiceService;
        this.screeningMatchService = screeningMatchService;
        this.documentService = documentService;
        this.aiDossierSummaryService = aiDossierSummaryService;
        this.embeddingStore = embeddingStore;
        this.embeddingModel = embeddingModel;
    }

    @Tool("Recherche un client par nom, prénom ou email. Retourne une liste simplifiée (ID, Nom, Email, Statut).")
    public String searchClients(String searchTerm) {
        try {
            var result = clientService.findAllWithFilters(searchTerm, null, null, null, PageRequest.of(0, 5));
            if (result.isEmpty())
                return "Aucun client trouvé pour : " + searchTerm;

            return result.getContent().stream()
                    .map(c -> String.format("- Client ID: %d, Nom/Raison Sociale: %s, Email: %s, Statut AML: %s",
                            c.getId(),
                            c.getNom() != null ? c.getNom()
                                    : (c.getNomCommercial() != null ? c.getNomCommercial() : "Inconnu"),
                            c.getEmail(),
                            c.getClientStatus()))
                    .collect(Collectors.joining("\n"));
        } catch (Exception e) {
            return "Erreur technique lors de la recherche du client: " + e.getMessage();
        }
    }

    @Tool("Récupère le détail complet d'un client spécifique en utilisant son ID (identifiant numérique).")
    public String getClientDetails(Long clientId) {
        try {
            var client = clientService.findById(clientId);
            if (client == null)
                return "Client introuvable avec l'ID: " + clientId;

            return String.format(
                    "Détails Client ID: %d\nType: %s\nNom: %s\nEmail: %s\nTéléphone: %s\nStatut: %s\nDate de création: %s",
                    client.getId(), client.getType(),
                    client.getNom() != null ? client.getNom() : client.getNomCommercial(),
                    client.getEmail(), client.getTelephone(),
                    client.getClientStatus(), client.getCreatedAt());
        } catch (Exception e) {
            return "Erreur technique lors de la récupération du client: " + e.getMessage();
        }
    }

    @Tool("Récupère la liste des dossiers juridiques récents. Retourne le titre et le statut de chaque dossier. 'limit' indique le nombre maximum de dossiers à retourner (par exemple 5).")
    public String getRecentDossiers(int limit) {
        try {
            // Sécurité de base sur la limite
            if (limit <= 0 || limit > 20)
                limit = 5;

            var result = dossierService.findAll(PageRequest.of(0, limit));
            if (result.isEmpty())
                return "Aucun dossier trouvé.";

            return result.getContent().stream()
                    .map(d -> String.format("- Dossier ID: %d, Titre: '%s', Référence: %s, Statut: %s",
                            d.getId(), d.getTitre(), d.getReferenceInterne(),
                            d.getStatutID() != null ? d.getStatutID() : "Non défini"))
                    .collect(Collectors.joining("\n"));
        } catch (Exception e) {
            return "Erreur technique lors de la récupération des dossiers: " + e.getMessage();
        }
    }

    @Tool("Recherche les factures associées à un client spécifique. Retourne les montants et le lien URL de la facture.")
    public String getInvoicesForClient(Long clientId) {
        try {
            var invoices = invoiceService.findAll(PageRequest.of(0, 100));
            var clientInvoices = invoices.getContent().stream()
                    .filter(i -> i.getDossier() != null && i.getDossier().getClient() != null
                            && clientId.equals(i.getDossier().getClient().getId()))
                    .collect(Collectors.toList());

            if (clientInvoices.isEmpty())
                return "Aucune facture trouvée pour le client ID: " + clientId;

            return clientInvoices.stream()
                    .map(i -> String.format(
                            "- Facture ID: %d, Numéro: %s, Statut: %s, Total: %s, Lien: http://localhost:4200/invoices/%d",
                            i.getId(), i.getNumeroFacture(), i.getStatus(), i.getTotalAmount(), i.getId()))
                    .collect(Collectors.joining("\n"));
        } catch (Exception e) {
            return "Erreur lors de la récupération des factures: " + e.getMessage();
        }
    }

    @Tool("Vérifie les correspondances de filtrage AML (Anti-Money Laundering / Sanctions) pour un client donné.")
    public String getClientAmlMatches(Long clientId) {
        try {
            var matches = screeningMatchService.findByClientId(clientId, PageRequest.of(0, 10));
            if (matches.isEmpty())
                return "Aucune alerte AML trouvée pour le client ID: " + clientId;

            return matches.getContent().stream()
                    .map(m -> String.format("- Match ID: %d, Statut de décision: %s, Identifiant Yente: %s",
                            m.getId(), m.getStatus(), m.getYenteId()))
                    .collect(Collectors.joining("\n"));
        } catch (Exception e) {
            return "Erreur technique lors de la vérification AML: " + e.getMessage();
        }
    }

    @Tool("Récupère les documents récemment ajoutés au système. 'limit' indique le nombre maximum de documents à retourner (par exemple 5).")
    public String getRecentDocuments(int limit) {
        try {
            if (limit <= 0 || limit > 20)
                limit = 5;
            var docs = documentService.findAll(PageRequest.of(0, limit));
            if (docs.isEmpty())
                return "Aucun document trouvé.";

            return docs.getContent().stream()
                    .map(d -> String.format("- Document ID: %d, Nom: %s, Type: %s, Date: %s",
                            d.getId(), d.getNomFichier(), d.getTypeDocument(), d.getDateUpload()))
                    .collect(Collectors.joining("\n"));
        } catch (Exception e) {
            return "Erreur technique lors de la récupération des documents: " + e.getMessage();
        }
    }

    @Tool("Génère un résumé complet d'un dossier. Retourne les informations, documents, tâches et l'historique d'actions (temps passé, qui a travaillé dessus, etc.).")
    public String summarizeDossier(Long dossierId) {
        try {
            return aiDossierSummaryService.generateDossierSummary(dossierId);
        } catch (Exception e) {
            e.printStackTrace();
            return "Erreur technique lors du résumé du dossier: " + e.getMessage();
        }
    }

    /**
     * Effectue une recherche sémantique (RAG) dans les documents appartenant à un
     * dossier spécifique.
     * Cette méthode convertit la question en vecteur, puis utilise l'API de Qdrant
     * pour trouver les
     * passages de texte pertinents dans les fichiers du dossier (filtrage sur
     * dossier_id).
     *
     * @param dossierId L'identifiant du dossier.
     * @param question  La question ou les mots-clés recherchés par l'IA.
     * @return Les passages de documents (chunks) qui correspondent sémantiquement à
     *         la question.
     */
    @Tool("Cherche des informations spécifiques (par mots-clés ou question sémantique) UNIQUEMENT dans les documents d'un dossier donné. "
            +
            "Utilise cet outil pour trouver des failles, des clauses ou des faits dans les pièces du dossier (RAG).")
    public String searchDocumentsInDossier(Long dossierId, String question) {
        try {
            if (question == null || question.trim().isEmpty()) {
                question = "résumé du dossier et des pièces importantes";
            }
            dev.langchain4j.data.embedding.Embedding queryEmbedding = embeddingModel.embed(question).content();

            // Workaround for Langchain4j Qdrant gRPC vector length bug: Call Qdrant REST
            // API directly
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();

            java.util.Map<String, Object> matchDossier = new java.util.HashMap<>();
            matchDossier.put("value", dossierId.toString());
            java.util.Map<String, Object> filterDossier = new java.util.HashMap<>();
            filterDossier.put("key", "dossier_id");
            filterDossier.put("match", matchDossier);

            java.util.Map<String, Object> mustCondition = new java.util.HashMap<>();
            mustCondition.put("must", java.util.Arrays.asList(filterDossier));

            java.util.Map<String, Object> requestBody = new java.util.HashMap<>();
            requestBody.put("vector", queryEmbedding.vectorAsList());
            requestBody.put("limit", 5);
            requestBody.put("with_payload", true);
            requestBody.put("with_vector", false);
            requestBody.put("score_threshold", 0.5);
            requestBody.put("filter", mustCondition);

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            org.springframework.http.HttpEntity<java.util.Map<String, Object>> entity = new org.springframework.http.HttpEntity<>(
                    requestBody, headers);

            org.springframework.http.ResponseEntity<java.util.Map> response = restTemplate.postForEntity(
                    "http://localhost:6333/collections/avo_docs_collection/points/search", entity, java.util.Map.class);

            java.util.Map<String, Object> body = response.getBody();
            if (body == null || !body.containsKey("result")) {
                return "Erreur lors de la recherche Qdrant (réponse vide).";
            }

            java.util.List<java.util.Map<String, Object>> points = (java.util.List<java.util.Map<String, Object>>) body
                    .get("result");

            if (points == null || points.isEmpty()) {
                return "Aucune information trouvée dans les documents du dossier " + dossierId + " pour la requête : "
                        + question;
            }

            StringBuilder sb = new StringBuilder();
            for (java.util.Map<String, Object> point : points) {
                java.util.Map<String, Object> payload = (java.util.Map<String, Object>) point.get("payload");
                String docId = payload != null && payload.containsKey("document_id")
                        ? payload.get("document_id").toString()
                        : "?";
                String nomFichier = payload != null && payload.containsKey("nom_fichier")
                        ? payload.get("nom_fichier").toString()
                        : "Inconnu";
                String textSegment = payload != null && payload.containsKey("text_segment")
                        ? payload.get("text_segment").toString()
                        : "";

                sb.append(String.format("[Doc %s - %s] %s\n\n", docId, nomFichier, textSegment));
            }

            return sb.toString().trim();

        } catch (Exception e) {
            e.printStackTrace();
            return "Erreur lors de la recherche dans les documents du dossier : " + e.getMessage();
        }
    }

    /**
     * Effectue une recherche sémantique globale dans la base de jurisprudence.
     * Appliquée spécifiquement sur le champ "type_document" = JURISPRUDENCE
     * et en filtrant par le pays renseigné (ex: FRANCE).
     *
     * @param pays     Le pays concerné par la jurisprudence (ex: FRANCE).
     * @param question La question juridique posée par l'IA.
     * @return Les textes de lois / jugements correspondants.
     */
    @Tool("Cherche des textes de lois, des arrêts de cassation ou de la jurisprudence dans la base de connaissances globale du cabinet. "
            +
            "Utilise cet outil pour trouver les articles de loi et la base légale pour défendre ton dossier.")
    public String searchJurisprudence(String pays, String question) {
        try {
            if (question == null || question.trim().isEmpty()) {
                question = "jurisprudence et lois";
            }
            dev.langchain4j.data.embedding.Embedding queryEmbedding = embeddingModel.embed(question).content();

            String paysFiltre = (pays != null && !pays.isBlank()) ? pays.toUpperCase() : "FRANCE";

            // Workaround for Langchain4j Qdrant gRPC vector length bug: Call Qdrant REST
            // API directly
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();

            java.util.Map<String, Object> matchTypeDoc = new java.util.HashMap<>();
            matchTypeDoc.put("value", "JURISPRUDENCE");
            java.util.Map<String, Object> filterTypeDoc = new java.util.HashMap<>();
            filterTypeDoc.put("key", "type_document");
            filterTypeDoc.put("match", matchTypeDoc);

            java.util.Map<String, Object> matchPays = new java.util.HashMap<>();
            matchPays.put("value", paysFiltre);
            java.util.Map<String, Object> filterPays = new java.util.HashMap<>();
            filterPays.put("key", "pays");
            filterPays.put("match", matchPays);

            java.util.Map<String, Object> mustCondition = new java.util.HashMap<>();
            mustCondition.put("must", java.util.Arrays.asList(filterTypeDoc, filterPays));

            java.util.Map<String, Object> requestBody = new java.util.HashMap<>();
            requestBody.put("vector", queryEmbedding.vectorAsList());
            requestBody.put("limit", 4);
            requestBody.put("with_payload", true);
            requestBody.put("with_vector", false);
            requestBody.put("score_threshold", 0.5);
            requestBody.put("filter", mustCondition);

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            org.springframework.http.HttpEntity<java.util.Map<String, Object>> entity = new org.springframework.http.HttpEntity<>(
                    requestBody, headers);

            org.springframework.http.ResponseEntity<java.util.Map> response = restTemplate.postForEntity(
                    "http://localhost:6333/collections/avo_docs_collection/points/search", entity, java.util.Map.class);

            java.util.Map<String, Object> body = response.getBody();
            if (body == null || !body.containsKey("result")) {
                return "Erreur lors de la recherche Qdrant (réponse vide).";
            }

            java.util.List<java.util.Map<String, Object>> points = (java.util.List<java.util.Map<String, Object>>) body
                    .get("result");

            if (points == null || points.isEmpty()) {
                return "Aucune jurisprudence ou loi trouvée dans la base pour le pays " + pays + " et la requête : "
                        + question;
            }

            StringBuilder sb = new StringBuilder();
            for (java.util.Map<String, Object> point : points) {
                java.util.Map<String, Object> payload = (java.util.Map<String, Object>) point.get("payload");
                String nomFichier = payload != null && payload.containsKey("nom_fichier")
                        ? payload.get("nom_fichier").toString()
                        : "Inconnu";
                String textSegment = payload != null && payload.containsKey("text_segment")
                        ? payload.get("text_segment").toString()
                        : "";

                sb.append(String.format("[Source: %s] %s\n\n", nomFichier, textSegment));
            }

            return sb.toString().trim();

        } catch (Exception e) {
            e.printStackTrace();
            return "Erreur lors de la recherche de jurisprudence : " + e.getMessage();
        }
    }
}
