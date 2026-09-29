package com.avo.service.ai;

import com.avo.entities.Document;
import com.avo.repositories.DocumentRepository;
import dev.langchain4j.data.document.DocumentParser;
import dev.langchain4j.data.document.parser.apache.tika.ApacheTikaDocumentParser;
import dev.langchain4j.data.document.splitter.DocumentSplitters;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.EmbeddingStoreIngestor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.io.ByteArrayInputStream;
import org.springframework.scheduling.annotation.Async;

/**
 * Service gérant l'ingestion de documents dans la base de données vectorielle Qdrant.
 * Ce service est crucial pour le système RAG (Retrieval-Augmented Generation), car il permet
 * à l'IA de rechercher et comprendre le contenu des documents (PDF, Word, etc.) téléversés.
 */
@Service
public class RAGDocumentService {

    private final EmbeddingStore<TextSegment> embeddingStore;
    private final EmbeddingModel embeddingModel;
    private final DocumentRepository documentRepository;
    private final com.avo.services.MinioService minioService;
    private final com.avo.service.AiConfigurationService aiConfigurationService;

    public RAGDocumentService(EmbeddingStore<TextSegment> embeddingStore,
            EmbeddingModel embeddingModel,
            DocumentRepository documentRepository,
            com.avo.services.MinioService minioService,
            com.avo.service.AiConfigurationService aiConfigurationService) {
        this.embeddingStore = embeddingStore;
        this.embeddingModel = embeddingModel;
        this.documentRepository = documentRepository;
        this.minioService = minioService;
        this.aiConfigurationService = aiConfigurationService;
    }

    /**
     * Ingestion asynchrone d'un document dans Qdrant.
     * Cette méthode est exécutée en arrière-plan via le pool de threads personnalisé (aiIngestionExecutor).
     * Elle lit le fichier depuis MinIO, extrait son texte, le découpe en petits morceaux (segments),
     * vectorise chaque morceau avec le modèle d'Embedding, et les sauvegarde dans Qdrant avec leurs métadonnées.
     *
     * @param documentId L'identifiant du document en base de données MySQL
     */
    @Async("aiIngestionExecutor")
    @Transactional(readOnly = true)
    public void ingestDocumentIntoQdrant(Long documentId) {
        if (!aiConfigurationService.isAiEnabled()) {
            return; // L'IA est désactivée, on ne fait pas d'ingestion RAG
        }

        // Étape 1 : Récupérer le document en base
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document introuvable: " + documentId));

        // Vérifier si le document possède bien un fichier associé
        if (doc.getMinioObjectId() == null || doc.getMinioObjectId().isBlank()) {
            throw new IllegalArgumentException("Le document n'a pas de fichier associé dans MinIO.");
        }

        // Étape 2 : Télécharger le flux (stream) du fichier depuis MinIO
        java.io.InputStream fileStream = minioService.getFileStream(doc.getMinioObjectId());
        if (fileStream == null) {
            throw new IllegalArgumentException("Impossible de lire le fichier depuis MinIO.");
        }

        // Étape 3 : Parsing du fichier (Extraction du texte brut depuis le PDF, Word, etc.) via Apache Tika
        DocumentParser parser = new ApacheTikaDocumentParser();
        dev.langchain4j.data.document.Document lcDocument = parser.parse(fileStream);

        // Étape 4 : Ajout des métadonnées (Metadata)
        // Les métadonnées sont cruciales pour filtrer les recherches de l'IA (ex: chercher uniquement dans les contrats d'un dossier précis)
        lcDocument.metadata().put("document_id", doc.getId().toString());
        lcDocument.metadata().put("nom_fichier", doc.getNomFichier() != null ? doc.getNomFichier() : "Inconnu");
        
        if (doc.getTypeDocument() != null) {
            lcDocument.metadata().put("type_document", doc.getTypeDocument().name());
        }
        
        if (doc.getPays() != null && !doc.getPays().isBlank()) {
            lcDocument.metadata().put("pays", doc.getPays().toUpperCase());
        }

        if (doc.getDossier() != null) {
            lcDocument.metadata().put("dossier_id", doc.getDossier().getId().toString());
            if (doc.getDossier().getTitre() != null) {
                lcDocument.metadata().put("dossier_nom", doc.getDossier().getTitre());
            }
        }

        if (doc.getClient() != null) {
            lcDocument.metadata().put("client_id", doc.getClient().getId().toString());
            String clientName = doc.getClient().getDisplayName();
            if (clientName != null) {
                lcDocument.metadata().put("client_nom", clientName.trim());
            }
        }

        // Étape 5 : Configuration de l'Ingestor et exécution
        // Le DocumentSplitter découpe le texte en blocs de 500 caractères, avec un chevauchement (overlap) de 50 caractères
        // Le chevauchement évite qu'une phrase importante soit coupée au milieu entre deux blocs
        EmbeddingStoreIngestor ingestor = EmbeddingStoreIngestor.builder()
                .documentSplitter(DocumentSplitters.recursive(500, 50))
                .embeddingModel(embeddingModel) // Modèle utilisé pour transformer le texte en vecteurs mathématiques
                .embeddingStore(embeddingStore) // La base de données vectorielle (Qdrant) où stocker les vecteurs
                .build();

        // Lancement de l'ingestion (Transformation en vecteurs et sauvegarde)
        ingestor.ingest(lcDocument);
    }

    /**
     * Ingestion synchrone d'un document dans Qdrant.
     * Identique à la version asynchrone, mais bloque le thread courant jusqu'à la fin du processus.
     * Utilisé généralement pour les tests ou des traitements en mode batch stricts.
     *
     * @param documentId L'identifiant du document
     */
    @Transactional(readOnly = true)
    public void ingestDocumentIntoQdrantSync(Long documentId) {
        if (!aiConfigurationService.isAiEnabled()) {
            return; // L'IA est désactivée, on ne fait pas d'ingestion RAG
        }

        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document introuvable: " + documentId));

        if (doc.getMinioObjectId() == null || doc.getMinioObjectId().isBlank()) {
            throw new IllegalArgumentException("Le document n'a pas de fichier associé dans MinIO.");
        }

        java.io.InputStream fileStream = minioService.getFileStream(doc.getMinioObjectId());
        if (fileStream == null) {
            throw new IllegalArgumentException("Impossible de lire le fichier depuis MinIO.");
        }

        DocumentParser parser = new ApacheTikaDocumentParser();
        dev.langchain4j.data.document.Document lcDocument = parser.parse(fileStream);

        lcDocument.metadata().put("document_id", doc.getId().toString());
        lcDocument.metadata().put("nom_fichier", doc.getNomFichier() != null ? doc.getNomFichier() : "Inconnu");
        
        if (doc.getTypeDocument() != null) {
            lcDocument.metadata().put("type_document", doc.getTypeDocument().name());
        }
        
        if (doc.getPays() != null && !doc.getPays().isBlank()) {
            lcDocument.metadata().put("pays", doc.getPays().toUpperCase());
        }

        if (doc.getDossier() != null) {
            lcDocument.metadata().put("dossier_id", doc.getDossier().getId().toString());
            if (doc.getDossier().getTitre() != null) {
                lcDocument.metadata().put("dossier_nom", doc.getDossier().getTitre());
            }
        }

        if (doc.getClient() != null) {
            lcDocument.metadata().put("client_id", doc.getClient().getId().toString());
            String clientName = doc.getClient().getDisplayName();
            if (clientName != null) {
                lcDocument.metadata().put("client_nom", clientName.trim());
            }
        }

        EmbeddingStoreIngestor ingestor = EmbeddingStoreIngestor.builder()
                .documentSplitter(DocumentSplitters.recursive(500, 50))
                .embeddingModel(embeddingModel)
                .embeddingStore(embeddingStore)
                .build();

        ingestor.ingest(lcDocument);
    }
}
