package com.avo.service.ai;

import com.avo.entities.Document;
import com.avo.repositories.DocumentRepository;
import com.avo.service.AiConfigurationService;
import com.avo.services.MinioService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.reader.tika.TikaDocumentReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.core.io.InputStreamResource;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Le RAG (Retrieval-Augmented Generation) en un seul service :
 * - indexer un document : MinIO → Tika (texte) → découpage → embeddings →
 * Qdrant ;
 * - retirer un document de Qdrant ;
 * - chercher les passages proches d'une question (dans un dossier, ou dans la
 * jurisprudence d'un pays).
 *
 * Tout passe par le VectorStore de Spring AI (Qdrant), qui calcule lui-même les
 * embeddings
 * avec le modèle Ollama configuré (spring.ai.ollama.embedding.options.model).
 */
@Service
public class RAGDocumentService {

    private static final Logger log = LoggerFactory.getLogger(RAGDocumentService.class);

    /**
     * Nombre maximum de pages (ou segments) envoyées à Qdrant et Ollama en un seul lot.
     *
     * <p>Pourquoi découper par lots de 50 pages ?</p>
     * <ul>
     *   <li>Un gros PDF (ex. Code civil ou Code du travail de 2 000+ pages) génère ~14 000 morceaux (chunks).</li>
     *   <li>Si on appelle {@code vectorStore.add(...)} sur les 14 000 morceaux d'un seul bloc, Spring AI calcule
     *       tous les embeddings en mémoire avant d'écrire quoi que ce soit dans Qdrant : aucun point n'est visible
     *       pendant des heures, la RAM explose et Ollama est saturé en continu sans laisser passer les requêtes de chat.</li>
     *   <li>En envoyant par lots de 50 pages (~250 à 350 chunks), chaque lot est immédiatement sauvegardé dans Qdrant,
     *       la progression est journalisée dans les logs, et une courte pause entre deux lots laisse respirer Ollama
     *       pour répondre aux questions de l'avocat (analyse stratégique, chat).</li>
     * </ul>
     */
    private static final int PAGES_BATCH_SIZE = 50;

    /**
     * ~150 tokens ≈ 500 à 600 caractères en français : des passages courts et
     * précis.
     */
    private final TokenTextSplitter splitter = TokenTextSplitter.builder()
            .withChunkSize(150)
            .withMinChunkSizeChars(100)
            .withMinChunkLengthToEmbed(5)
            .withMaxNumChunks(10000)
            .withKeepSeparator(true)
            .build();

    private final VectorStore vectorStore;
    private final DocumentRepository documentRepository;
    private final MinioService minioService;
    private final AiConfigurationService aiConfigurationService;

    public RAGDocumentService(VectorStore vectorStore,
            DocumentRepository documentRepository,
            MinioService minioService,
            AiConfigurationService aiConfigurationService) {
        this.vectorStore = vectorStore;
        this.documentRepository = documentRepository;
        this.minioService = minioService;
        this.aiConfigurationService = aiConfigurationService;
    }

    // ------------------------------------------------------------------ Indexation

    /**
     * Indexation en arrière-plan (pool aiIngestionExecutor), déclenchée après
     * l'upload.
     */
    @Async("aiIngestionExecutor")
    @Transactional(readOnly = true)
    public void ingestDocumentIntoQdrant(Long documentId) {
        ingest(documentId);
    }

    /** Indexation bloquante, utilisée par la resynchronisation complète. */
    @Transactional(readOnly = true)
    public void ingestDocumentIntoQdrantSync(Long documentId) {
        ingest(documentId);
    }

    private void ingest(Long documentId) {
        if (!aiConfigurationService.isAiEnabled()) {
            return; // L'IA est désactivée : pas d'indexation
        }

        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document introuvable: " + documentId));
        if (doc.getMinioObjectId() == null || doc.getMinioObjectId().isBlank()) {
            throw new IllegalArgumentException("Le document n'a pas de fichier associé dans MinIO.");
        }

        // 1. Lire le fichier depuis MinIO et extraire le texte avec Tika (PDF, Word...)
        // PDF : une entrée par page (le numéro de page suit chaque passage jusqu'à la
        // source citée par l'IA).
        // Autres formats (Word, texte...) : lecture globale par Tika.
        List<org.springframework.ai.document.Document> pages;
        try (InputStream in = minioService.getFileStream(doc.getMinioObjectId())) {
            if (in == null) {
                throw new IllegalArgumentException("Impossible de lire le fichier depuis MinIO.");
            }
            byte[] bytes = in.readAllBytes();
            pages = isPdf(bytes) ? readPdfPages(bytes)
                    : new TikaDocumentReader(new org.springframework.core.io.ByteArrayResource(bytes)).get();
        } catch (java.io.IOException e) {
            throw new IllegalStateException("Erreur de lecture du fichier du document " + documentId, e);
        }

        // 2. Métadonnées : elles servent à filtrer les recherches (par dossier, type,
        // pays...) et à présenter la source (fichier, page, fiche de la décision)
        Map<String, Object> metadata = metadataOf(doc);
        detectDecisionReferences(metadata, pages);
        List<org.springframework.ai.document.Document> withMetadata = pages.stream()
                .filter(p -> p.getText() != null && !p.getText().isBlank())
                .map(p -> {
                    Map<String, Object> m = new HashMap<>(metadata);
                    Object page = p.getMetadata().get("page_number");
                    if (page != null) {
                        m.put("page_number", page);
                    }
                    return new org.springframework.ai.document.Document(p.getText(), m);
                })
                .toList();

        // 3. Retirer l'ancienne version du document (pas de doublons), puis découper,
        // vectoriser et stocker par lots de PAGES_BATCH_SIZE (50 pages) pour ne pas bloquer
        // Ollama et Qdrant pendant des heures sur les très gros PDF (ex. Codes de 2 000 pages).
        removeDocumentFromQdrant(doc.getId());

        int totalPages = withMetadata.size();
        int totalChunksInserted = 0;
        log.info("[RAG] Début d'indexation du document #{} ('{}') : {} page(s) à traiter par lots de {}.",
                doc.getId(), doc.getNomFichier(), totalPages, PAGES_BATCH_SIZE);

        for (int start = 0; start < totalPages; start += PAGES_BATCH_SIZE) {
            int end = Math.min(start + PAGES_BATCH_SIZE, totalPages);
            List<org.springframework.ai.document.Document> pageBatch = withMetadata.subList(start, end);

            // Découpage en chunks (~150 tokens) uniquement pour ce lot de 50 pages
            List<org.springframework.ai.document.Document> chunkBatch = splitter.apply(pageBatch);
            if (!chunkBatch.isEmpty()) {
                // Calcul des embeddings via Ollama et insertion immédiate du lot dans Qdrant
                vectorStore.add(chunkBatch);
                totalChunksInserted += chunkBatch.size();
            }

            log.info("[RAG] Document #{} ('{}') : lot pages {}-{}/{} indexé ({} chunks, cumul: {} chunks).",
                    doc.getId(), doc.getNomFichier(), start + 1, end, totalPages, chunkBatch.size(), totalChunksInserted);

            // Si le document comporte plusieurs lots, on marque une courte pause (200 ms) entre deux lots
            // pour éviter de monopoliser 100 % des slots d'Ollama si un avocat lance une analyse stratégique en parallèle.
            if (end < totalPages) {
                try {
                    Thread.sleep(200);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    log.warn("[RAG] Indexation du document #{} interrompue à la page {}/{}.", doc.getId(), end, totalPages);
                    break;
                }
            }
        }

        log.info("[RAG] Indexation terminée pour le document #{} ('{}') : {} chunks enregistrés dans Qdrant.",
                doc.getId(), doc.getNomFichier(), totalChunksInserted);
    }

    private static boolean isPdf(byte[] bytes) {
        return bytes.length > 4 && bytes[0] == '%' && bytes[1] == 'P' && bytes[2] == 'D' && bytes[3] == 'F';
    }

    /**
     * Texte d'un PDF page par page (PDFBox), avec la métadonnée page_number (1, 2,
     * 3...).
     */
    private static List<org.springframework.ai.document.Document> readPdfPages(byte[] bytes)
            throws java.io.IOException {
        List<org.springframework.ai.document.Document> pages = new java.util.ArrayList<>();
        try (org.apache.pdfbox.pdmodel.PDDocument pdf = org.apache.pdfbox.Loader.loadPDF(bytes)) {
            org.apache.pdfbox.text.PDFTextStripper stripper = new org.apache.pdfbox.text.PDFTextStripper();
            for (int i = 1; i <= pdf.getNumberOfPages(); i++) {
                stripper.setStartPage(i);
                stripper.setEndPage(i);
                String text = stripper.getText(pdf);
                if (text != null && !text.isBlank()) {
                    pages.add(new org.springframework.ai.document.Document(text, Map.of("page_number", i)));
                }
            }
        }
        return pages;
    }

    /**
     * Si la fiche de la décision n'indique ni numéro ni ECLI, on les cherche dans
     * le texte (premières pages) :
     * la source citée par l'IA porte alors son identifiant officiel, et la
     * vérification peut s'y appuyer.
     */
    private static void detectDecisionReferences(Map<String, Object> metadata,
            List<org.springframework.ai.document.Document> pages) {
        if (metadata.containsKey("numero_decision") && metadata.containsKey("ecli")) {
            return;
        }
        String head = pages.stream().limit(3).map(org.springframework.ai.document.Document::getText)
                .filter(java.util.Objects::nonNull).reduce("", (a, b) -> a + "\n" + b);
        for (com.avo.service.ai.sources.LegalReferences.Found f : com.avo.service.ai.sources.LegalReferences
                .find(head)) {
            if (com.avo.service.ai.sources.LegalReferences.POURVOI.equals(f.kind())) {
                metadata.putIfAbsent("numero_decision", f.key());
            } else if (com.avo.service.ai.sources.LegalReferences.ECLI.equals(f.kind())) {
                metadata.putIfAbsent("ecli", f.key());
            }
        }
    }

    private static Map<String, Object> metadataOf(Document doc) {
        Map<String, Object> metadata = new HashMap<>();
        putIfPresent(metadata, "juridiction", doc.getJuridiction());
        putIfPresent(metadata, "date_decision", doc.getDateDecision() == null ? null
                : doc.getDateDecision().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        putIfPresent(metadata, "numero_decision", doc.getNumeroDecision());
        putIfPresent(metadata, "ecli", doc.getEcli());
        putIfPresent(metadata, "source_url", doc.getSourceUrl());
        metadata.put("document_id", doc.getId().toString());
        metadata.put("nom_fichier", doc.getNomFichier() != null ? doc.getNomFichier() : "Inconnu");
        if (doc.getTypeDocument() != null) {
            metadata.put("type_document", doc.getTypeDocument().name());
        }
        if (doc.getPays() != null && !doc.getPays().isBlank()) {
            metadata.put("pays", doc.getPays().toUpperCase());
        }
        if (doc.getDossier() != null) {
            metadata.put("dossier_id", doc.getDossier().getId().toString());
            if (doc.getDossier().getTitre() != null) {
                metadata.put("dossier_nom", doc.getDossier().getTitre());
            }
        }
        if (doc.getClient() != null) {
            metadata.put("client_id", doc.getClient().getId().toString());
            String clientName = doc.getClient().getDisplayName();
            if (clientName != null) {
                metadata.put("client_nom", clientName.trim());
            }
        }
        return metadata;
    }

    private static void putIfPresent(Map<String, Object> metadata, String key, String value) {
        if (value != null && !value.isBlank()) {
            metadata.put(key, value.trim());
        }
    }

    /**
     * Supprime tous les passages d'un document (réindexation ou suppression du
     * document).
     * Une erreur Qdrant est journalisée sans être propagée.
     */
    public void removeDocumentFromQdrant(Long documentId) {
        try {
            vectorStore.delete("document_id == '" + documentId + "'");
        } catch (Exception e) {
            log.warn("Impossible de retirer le document {} de Qdrant : {}", documentId, e.getMessage());
        }
    }

    // ------------------------------------------------------------------ Recherche

    /**
     * Passages les plus proches de la question, uniquement dans les pièces du
     * dossier.
     */
    public List<org.springframework.ai.document.Document> searchInDossier(Long dossierId, String question) {
        return vectorStore.similaritySearch(SearchRequest.builder()
                .query(question)
                .topK(5)
                .similarityThreshold(0.5)
                .filterExpression("dossier_id == '" + dossierId + "'")
                .build());
    }

    /**
     * Base légale d'un droit applicable : jurisprudence ET textes de loi (types JURISPRUDENCE et LEGISLATION)
     * du pays donné, plus l'international (CJUE, CEDH, conventions), qui s'applique dans tous les pays gérés.
     * Le pays est normalisé : seule une valeur connue peut entrer dans le filtre Qdrant.
     */
    public List<org.springframework.ai.document.Document> searchJurisprudence(String pays, String question) {
        org.springframework.ai.vectorstore.filter.FilterExpressionBuilder f =
                new org.springframework.ai.vectorstore.filter.FilterExpressionBuilder();
        Object[] perimetre = Pays.perimetre(pays).toArray();
        return vectorStore.similaritySearch(SearchRequest.builder()
                .query(question)
                .topK(6)
                .similarityThreshold(0.5)
                .filterExpression(f.and(
                        f.in("type_document", "JURISPRUDENCE", "LEGISLATION"),
                        f.in("pays", perimetre)).build())
                .build());
    }
}
