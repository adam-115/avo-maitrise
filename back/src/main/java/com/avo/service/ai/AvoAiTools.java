package com.avo.service.ai;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;
import org.springframework.data.domain.PageRequest;

import com.avo.audit.AuditAction;
import com.avo.audit.AuditOutcome;
import com.avo.audit.AuditService;
import com.avo.service.ai.sources.SourceRef;
import com.avo.service.ai.sources.SourceRegistry;
import com.avo.services.ClientService;
import com.avo.services.DossierService;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Composant central contenant les "Outils" (Tools/Functions) mis à disposition
 * de l'Intelligence Artificielle.
 * Spring AI lit les annotations @Tool de cette classe et fournit leur
 * description
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
    private final AuditService auditService;
    private final SourceRegistry sourceRegistry;
    private final com.avo.services.deadline.DossierDeadlineService dossierDeadlineService;

    public AvoAiTools(ClientService clientService, DossierService dossierService,
            com.avo.services.InvoiceService invoiceService,
            com.avo.services.ScreeningMatchService screeningMatchService,
            com.avo.services.DocumentService documentService,
            AiDossierSummaryService aiDossierSummaryService,
            RAGDocumentService ragDocumentService,
            AuditService auditService,
            SourceRegistry sourceRegistry,
            com.avo.services.deadline.DossierDeadlineService dossierDeadlineService) {
        this.clientService = clientService;
        this.dossierService = dossierService;
        this.invoiceService = invoiceService;
        this.screeningMatchService = screeningMatchService;
        this.documentService = documentService;
        this.aiDossierSummaryService = aiDossierSummaryService;
        this.ragDocumentService = ragDocumentService;
        this.auditService = auditService;
        this.sourceRegistry = sourceRegistry;
        this.dossierDeadlineService = dossierDeadlineService;
    }

    /**
     * Chaque lecture de données par l'IA est tracée au nom de l'utilisateur qui a
     * posé la question
     * (les outils s'exécutent dans le thread de sa requête). La jurisprudence,
     * publique, n'est pas tracée.
     */
    private void traceIa(String resourceType, Object resourceId, String details) {
        auditService.record(AuditAction.ACCES_IA, resourceType, resourceId, AuditOutcome.SUCCES, details);
    }

    /**
     * Inscrit une donnée du logiciel (fiche client, liste de dossiers...) comme
     * source citable et la renvoie
     * précédée de son identifiant : l'IA doit citer [S#] pour toute affirmation
     * tirée de cette donnée.
     */
    private String asSource(String title, String link, String content) {
        String id = sourceRegistry.register(SourceRef.DONNEE, title, null, null, content, link, null, null);
        return "[" + id + "] " + title + " :\n" + content;
    }

    /**
     * Inscrit un passage de document (pièce ou jurisprudence) et le formate pour le
     * modèle.
     */
    private String passage(String kind, org.springframework.ai.document.Document p) {
        Map<String, Object> meta = p.getMetadata();
        String fileName = String.valueOf(meta.getOrDefault("nom_fichier", "Document"));
        Long documentId = parseLong(meta.get("document_id"));
        Integer page = parseInt(meta.get("page_number"));
        Map<String, String> details = new HashMap<>();
        // Un texte de loi (LEGISLATION) est distingué d'une décision, et chaque source
        // affiche son pays
        if ("LEGISLATION".equals(String.valueOf(meta.get("type_document")))) {
            kind = SourceRef.LEGISLATION;
        }
        for (String key : new String[] { "pays", "juridiction", "date_decision", "numero_decision", "ecli" }) {
            Object v = meta.get(key);
            if (v != null && !String.valueOf(v).isBlank()) {
                details.put(key, String.valueOf(v));
            }
        }
        Object url = meta.get("source_url");
        String id = sourceRegistry.register(kind, fileName, documentId, page, p.getText(), null,
                url == null || String.valueOf(url).isBlank() ? null : String.valueOf(url), details);
        StringBuilder header = new StringBuilder("[").append(id).append("] « ").append(fileName).append(" »");
        if (page != null)
            header.append(", page ").append(page);
        if (!details.isEmpty())
            header.append(" (").append(String.join(", ", details.values())).append(")");
        return header.append(" :\n").append(p.getText()).toString();
    }

    private static Long parseLong(Object v) {
        try {
            return v == null ? null : Long.valueOf(String.valueOf(v));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Integer parseInt(Object v) {
        try {
            return v == null ? null : (int) Double.parseDouble(String.valueOf(v));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @Tool(description = "Recherche un client par nom, prénom ou email. Retourne une liste simplifiée (ID, Nom, Email, Statut).")
    public String searchClients(String searchTerm) {
        traceIa("CLIENT", null, "Recherche de clients : " + searchTerm);
        try {
            var result = clientService.findAllWithFilters(searchTerm, null, null, null, PageRequest.of(0, 5));
            if (result.isEmpty())
                return "Aucun client trouvé pour : " + searchTerm;

            return asSource("Recherche de clients « " + searchTerm + " »", null, result.getContent().stream()
                    .map(c -> String.format("- Client ID: %d, Nom/Raison Sociale: %s, Email: %s, Statut AML: %s",
                            c.getId(),
                            c.getNom() != null ? c.getNom()
                                    : (c.getNomCommercial() != null ? c.getNomCommercial() : "Inconnu"),
                            c.getEmail(),
                            c.getClientStatus()))
                    .collect(Collectors.joining("\n")));
        } catch (Exception e) {
            return "Erreur technique lors de la recherche du client: " + e.getMessage();
        }
    }

    @Tool(description = "Récupère le détail complet d'un client spécifique en utilisant son ID (identifiant numérique).")
    public String getClientDetails(Long clientId) {
        traceIa("CLIENT", clientId, "Détail du client");
        try {
            var client = clientService.findById(clientId);
            if (client == null)
                return "Client introuvable avec l'ID: " + clientId;

            return asSource("Fiche client #" + clientId, "/home/client-details?id=" + clientId, String.format(
                    "Détails Client ID: %d\nType: %s\nNom: %s\nEmail: %s\nTéléphone: %s\nStatut: %s\nDate de création: %s",
                    client.getId(), client.getType(),
                    client.getNom() != null ? client.getNom() : client.getNomCommercial(),
                    client.getEmail(), client.getTelephone(),
                    client.getClientStatus(), client.getCreatedAt()));
        } catch (Exception e) {
            return "Erreur technique lors de la récupération du client: " + e.getMessage();
        }
    }

    @Tool(description = "Récupère la liste des dossiers juridiques récents. Retourne le titre et le statut de chaque dossier. 'limit' indique le nombre maximum de dossiers à retourner (par exemple 5).")
    public String getRecentDossiers(int limit) {
        traceIa("DOSSIER", null, "Liste des dossiers récents");
        try {
            // Sécurité de base sur la limite
            if (limit <= 0 || limit > 20)
                limit = 5;

            var result = dossierService.findAll(PageRequest.of(0, limit));
            if (result.isEmpty())
                return "Aucun dossier trouvé.";

            return asSource("Liste des dossiers récents", null, result.getContent().stream()
                    .map(d -> String.format("- Dossier ID: %d, Titre: '%s', Référence: %s, Statut: %s",
                            d.getId(), d.getTitre(), d.getReferenceInterne(),
                            d.getStatutID() != null ? d.getStatutID() : "Non défini"))
                    .collect(Collectors.joining("\n")));
        } catch (Exception e) {
            return "Erreur technique lors de la récupération des dossiers: " + e.getMessage();
        }
    }

    @Tool(description = "Recherche les factures associées à un client spécifique. Retourne les montants et le lien URL de la facture.")
    public String getInvoicesForClient(Long clientId) {
        traceIa("CLIENT", clientId, "Factures du client");
        try {
            var invoices = invoiceService.findAll(PageRequest.of(0, 100));
            var clientInvoices = invoices.getContent().stream()
                    .filter(i -> i.getDossier() != null && i.getDossier().getClient() != null
                            && clientId.equals(i.getDossier().getClient().getId()))
                    .collect(Collectors.toList());

            if (clientInvoices.isEmpty())
                return "Aucune facture trouvée pour le client ID: " + clientId;

            return asSource("Factures du client #" + clientId, "/home/client-details?id=" + clientId, clientInvoices
                    .stream()
                    .map(i -> String.format(
                            "- Facture ID: %d, Numéro: %s, Statut: %s, Total: %s, Lien: http://localhost:4200/invoices/%d",
                            i.getId(), i.getNumeroFacture(), i.getStatus(), i.getTotalAmount(), i.getId()))
                    .collect(Collectors.joining("\n")));
        } catch (Exception e) {
            return "Erreur lors de la récupération des factures: " + e.getMessage();
        }
    }

    @Tool(description = "Vérifie les correspondances de filtrage AML (Anti-Money Laundering / Sanctions) pour un client donné.")
    public String getClientAmlMatches(Long clientId) {
        traceIa("CLIENT", clientId, "Alertes LCB-FT du client");
        try {
            var matches = screeningMatchService.findByClientId(clientId, PageRequest.of(0, 10));
            if (matches.isEmpty())
                return "Aucune alerte AML trouvée pour le client ID: " + clientId;

            return asSource("Alertes LCB-FT du client #" + clientId, "/home/client-details?id=" + clientId,
                    matches.getContent().stream()
                            .map(m -> String.format("- Match ID: %d, Statut de décision: %s, Identifiant Yente: %s",
                                    m.getId(), m.getStatus(), m.getYenteId()))
                            .collect(Collectors.joining("\n")));
        } catch (Exception e) {
            return "Erreur technique lors de la vérification AML: " + e.getMessage();
        }
    }

    @Tool(description = "Récupère les documents récemment ajoutés au système. 'limit' indique le nombre maximum de documents à retourner (par exemple 5).")
    public String getRecentDocuments(int limit) {
        traceIa("DOCUMENT", null, "Liste des documents récents");
        try {
            if (limit <= 0 || limit > 20)
                limit = 5;
            var docs = documentService.findAll(PageRequest.of(0, limit));
            if (docs.isEmpty())
                return "Aucun document trouvé.";

            return asSource("Liste des documents récents", null, docs.getContent().stream()
                    .map(d -> String.format("- Document ID: %d, Nom: %s, Type: %s, Date: %s",
                            d.getId(), d.getNomFichier(), d.getTypeDocument(), d.getDateUpload()))
                    .collect(Collectors.joining("\n")));
        } catch (Exception e) {
            return "Erreur technique lors de la récupération des documents: " + e.getMessage();
        }
    }

    @Tool(description = "Génère un résumé complet d'un dossier. Retourne les informations, documents, tâches et l'historique d'actions (temps passé, qui a travaillé dessus, etc.).")
    public String summarizeDossier(Long dossierId) {
        traceIa("DOSSIER", dossierId, "Résumé du dossier");
        try {
            return asSource("Résumé du dossier #" + dossierId, "/home/dossier-detail/" + dossierId,
                    aiDossierSummaryService.generateDossierSummary(dossierId));
        } catch (Exception e) {
            e.printStackTrace();
            return "Erreur technique lors du résumé du dossier: " + e.getMessage();
        }
    }

    @Tool(description = "Récupère la liste officielle des délais de procédure (appel, prescription, péremption, conclusions) calculés et enregistrés sur un dossier, avec leur date limite exacte, leur statut et le nombre de jours restants.")
    public String getDossierDeadlines(
            @ToolParam(description = "Identifiant numérique du dossier") Long dossierId) {
        traceIa("DOSSIER", dossierId, "Consultation des délais de procédure");
        try {
            var deadlines = dossierDeadlineService.findByDossier(dossierId);
            if (deadlines.isEmpty()) {
                return "Aucun délai de procédure n'est encore enregistré sur le dossier " + dossierId + ".";
            }
            String content = deadlines.stream()
                    .map(d -> String.format("- [%s | %s] %s : échéance le %s (%s) · Base légale : %s · Calcul : %s",
                            d.getStatut(),
                            d.getCategorie(),
                            d.getTitre(),
                            d.getDateEcheanceFinale(),
                            d.isEnRetard() ? ("EN RETARD de " + Math.abs(d.getJoursRestants()) + " j")
                                    : ("J-" + d.getJoursRestants()),
                            d.getBaseLegale() != null ? d.getBaseLegale() : "N/A",
                            d.getDetailCalcul() != null ? d.getDetailCalcul() : ""))
                    .collect(Collectors.joining("\n"));
            return asSource("Délais de procédure du dossier #" + dossierId,
                    "/home/dossier-detail/" + dossierId + "/delais", content);
        } catch (Exception e) {
            return "Erreur lors de la récupération des délais du dossier : " + e.getMessage();
        }
    }

    /**
     * Recherche sémantique (RAG) dans les documents d'un dossier : Qdrant renvoie
     * les
     * passages les plus proches de la question parmi les fichiers du dossier
     * (filtre dossier_id).
     */
    @Tool(description = "Cherche des informations spécifiques (par mots-clés ou question sémantique) UNIQUEMENT dans les documents d'un dossier donné. "
            + "Utilise cet outil pour trouver des failles, des clauses ou des faits dans les pièces du dossier (RAG).")
    public String searchDocumentsInDossier(
            @ToolParam(description = "Identifiant numérique du dossier") Long dossierId,
            @ToolParam(description = "Question ou mots-clés à rechercher dans les pièces") String question) {
        traceIa("DOSSIER", dossierId, "Recherche dans les pièces : " + question);
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
                    .map(p -> passage(SourceRef.DOCUMENT, p))
                    .collect(Collectors.joining("\n\n"));
        } catch (Exception e) {
            log.error("Erreur recherche RAG dossier {}", dossierId, e);
            return "Erreur lors de la recherche dans les documents du dossier : " + e.getMessage();
        }
    }

    /**
     * Recherche sémantique dans la base légale du cabinet : jurisprudence et textes
     * de loi du pays, plus
     * l'international. Si l'avocat a imposé un droit applicable (AiJurisdiction),
     * il remplace le pays demandé.
     */
    @Tool(description = "Cherche des textes de lois, des arrêts de cassation ou de la jurisprudence dans la base de connaissances globale du cabinet. "
            + "Utilise cet outil pour trouver les articles de loi et la base légale pour défendre ton dossier.")
    public String searchJurisprudence(
            @ToolParam(description = "Pays du droit applicable : FRANCE, LUXEMBOURG, BELGIQUE, ALLEMAGNE, SUISSE ou INTERNATIONAL") String pays,
            @ToolParam(description = "Question juridique à rechercher") String question) {
        // Le droit choisi par l'avocat (chat) ou le pays du dossier (stratégie) prime
        // sur celui demandé par le modèle
        String impose = com.avo.service.ai.sources.AiJurisdiction.get();
        String paysFiltre = Pays.normalize(impose != null ? impose : pays);
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
                    .map(p -> passage(SourceRef.JURISPRUDENCE, p))
                    .collect(Collectors.joining("\n\n"));
        } catch (Exception e) {
            log.error("Erreur recherche jurisprudence ({})", paysFiltre, e);
            return "Erreur lors de la recherche de jurisprudence : " + e.getMessage();
        }
    }
}
