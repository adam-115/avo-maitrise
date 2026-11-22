package com.avo.service.ai;

import com.avo.entities.Document;
import com.avo.repositories.DocumentRepository;
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
    private final com.avo.services.MinioService minioService;
    private final com.avo.service.AiConfigurationService aiConfigurationService;

    public RAGDocumentService(VectorStore vectorStore,
            DocumentRepository documentRepository,
            com.avo.services.MinioService minioService,
            com.avo.service.AiConfigurationService aiConfigurationService) {
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
        List<org.springframework.ai.document.Document> pages;
        try (InputStream in = minioService.getFileStream(doc.getMinioObjectId())) {
            if (in == null) {
                throw new IllegalArgumentException("Impossible de lire le fichier depuis MinIO.");
            }
            pages = new TikaDocumentReader(new InputStreamResource(in)).get();
        } catch (java.io.IOException e) {
            throw new IllegalStateException("Erreur de lecture du fichier du document " + documentId, e);
        }

        // 2. Métadonnées : elles servent à filtrer les recherches (par dossier, type,
        // pays...)
        Map<String, Object> metadata = metadataOf(doc);
        List<org.springframework.ai.document.Document> withMetadata = pages.stream()
                .filter(p -> p.getText() != null && !p.getText().isBlank())
                .map(p -> new org.springframework.ai.document.Document(p.getText(), new HashMap<>(metadata)))
                .toList();

        // 3. Retirer l'ancienne version du document (pas de doublons), découper,
        // vectoriser, stocker
        removeDocumentFromQdrant(doc.getId());
        vectorStore.add(splitter.apply(withMetadata));
    }

    private static Map<String, Object> metadataOf(Document doc) {
        Map<String, Object> metadata = new HashMap<>();
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
     * Passages de jurisprudence / lois du pays donné (documents de type
     * JURISPRUDENCE).
     */
    public List<org.springframework.ai.document.Document> searchJurisprudence(String pays, String question) {
        return vectorStore.similaritySearch(SearchRequest.builder()
                .query(question)
                .topK(4)
                .similarityThreshold(0.5)
                .filterExpression("type_document == 'JURISPRUDENCE' && pays == '" + pays + "'")
                .build());
    }
}
