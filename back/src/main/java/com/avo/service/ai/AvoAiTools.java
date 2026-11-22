package com.avo.service.ai;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;
import org.springframework.data.domain.PageRequest;

import com.avo.services.ClientService;
import com.avo.services.DossierService;

import java.util.stream.Collectors;

/**
 * Composant central contenant les "Outils" (Tools/Functions) mis à disposition
 * de l'Intelligence Artificielle.
 * Spring AI lit les annotations @Tool de cette classe et fournit leur description
 * au LLM (ChatClient.tools(avoAiTools)).
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
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AvoAiTools.class);

    private final AiDossierSummaryService aiDossierSummaryService;
    private final RAGDocumentService ragDocumentService;

    public AvoAiTools(ClientService clientService, DossierService dossierService,
            com.avo.services.InvoiceService invoiceService,
            com.avo.services.ScreeningMatchService screeningMatchService,
            com.avo.services.DocumentService documentService,
            AiDossierSummaryService aiDossierSummaryService,
            RAGDocumentService ragDocumentService) {
        this.clientService = clientService;
        this.dossierService = dossierService;
        this.invoiceService = invoiceService;
        this.screeningMatchService = screeningMatchService;
        this.documentService = documentService;
        this.aiDossierSummaryService = aiDossierSummaryService;
        this.ragDocumentService = ragDocumentService;
    }

    @Tool(description = "Recherche un client par nom, prénom ou email. Retourne une liste simplifiée (ID, Nom, Email, Statut).")
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

    @Tool(description = "Récupère le détail complet d'un client spécifique en utilisant son ID (identifiant numérique).")
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

    @Tool(description = "Récupère la liste des dossiers juridiques récents. Retourne le titre et le statut de chaque dossier. 'limit' indique le nombre maximum de dossiers à retourner (par exemple 5).")
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

    @Tool(description = "Recherche les factures associées à un client spécifique. Retourne les montants et le lien URL de la facture.")
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

    @Tool(description = "Vérifie les correspondances de filtrage AML (Anti-Money Laundering / Sanctions) pour un client donné.")
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

    @Tool(description = "Récupère les documents récemment ajoutés au système. 'limit' indique le nombre maximum de documents à retourner (par exemple 5).")
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

    @Tool(description = "Génère un résumé complet d'un dossier. Retourne les informations, documents, tâches et l'historique d'actions (temps passé, qui a travaillé dessus, etc.).")
    public String summarizeDossier(Long dossierId) {
        try {
            return aiDossierSummaryService.generateDossierSummary(dossierId);
        } catch (Exception e) {
            e.printStackTrace();
            return "Erreur technique lors du résumé du dossier: " + e.getMessage();
        }
    }

    /**
     * Recherche sémantique (RAG) dans les documents d'un dossier : Qdrant renvoie les
     * passages les plus proches de la question parmi les fichiers du dossier (filtre dossier_id).
     */
    @Tool(description = "Cherche des informations spécifiques (par mots-clés ou question sémantique) UNIQUEMENT dans les documents d'un dossier donné. "
            + "Utilise cet outil pour trouver des failles, des clauses ou des faits dans les pièces du dossier (RAG).")
    public String searchDocumentsInDossier(
            @ToolParam(description = "Identifiant numérique du dossier") Long dossierId,
            @ToolParam(description = "Question ou mots-clés à rechercher dans les pièces") String question) {
        try {
            if (question == null || question.isBlank()) {
                question = "résumé du dossier et des pièces importantes";
            }
            var passages = ragDocumentService.searchInDossier(dossierId, question);
            if (passages.isEmpty()) {
                return "Aucune information trouvée dans les documents du dossier " + dossierId + " pour la requête : "
                        + question;
            }
            return passages.stream()
                    .map(p -> String.format("[Doc %s - %s] %s", p.getMetadata().getOrDefault("document_id", "?"),
                            p.getMetadata().getOrDefault("nom_fichier", "Inconnu"), p.getText()))
                    .collect(Collectors.joining("\n\n"));
        } catch (Exception e) {
            log.error("Erreur recherche RAG dossier {}", dossierId, e);
            return "Erreur lors de la recherche dans les documents du dossier : " + e.getMessage();
        }
    }

    /**
     * Recherche sémantique dans la base de jurisprudence (type_document = JURISPRUDENCE),
     * filtrée par pays (ex: FRANCE).
     */
    @Tool(description = "Cherche des textes de lois, des arrêts de cassation ou de la jurisprudence dans la base de connaissances globale du cabinet. "
            + "Utilise cet outil pour trouver les articles de loi et la base légale pour défendre ton dossier.")
    public String searchJurisprudence(
            @ToolParam(description = "Pays du droit applicable : FRANCE, LUXEMBOURG, BELGIQUE, ALLEMAGNE, SUISSE ou INTERNATIONAL") String pays,
            @ToolParam(description = "Question juridique à rechercher") String question) {
        String paysFiltre = Pays.normalize(pays);
        try {
            if (question == null || question.isBlank()) {
                question = "jurisprudence et lois";
            }
            var passages = ragDocumentService.searchJurisprudence(paysFiltre, question);
            if (passages.isEmpty()) {
                return "Aucune jurisprudence ou loi trouvée dans la base pour le pays " + paysFiltre
                        + " et la requête : " + question;
            }
            return passages.stream()
                    .map(p -> String.format("[Source: %s] %s", p.getMetadata().getOrDefault("nom_fichier", "Inconnu"),
                            p.getText()))
                    .collect(Collectors.joining("\n\n"));
        } catch (Exception e) {
            log.error("Erreur recherche jurisprudence ({})", paysFiltre, e);
            return "Erreur lors de la recherche de jurisprudence : " + e.getMessage();
        }
    }
}
