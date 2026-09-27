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

@Service
public class RAGDocumentService {

    private final EmbeddingStore<TextSegment> embeddingStore;
    private final EmbeddingModel embeddingModel;
    private final DocumentRepository documentRepository;

    public RAGDocumentService(EmbeddingStore<TextSegment> embeddingStore,
            EmbeddingModel embeddingModel,
            DocumentRepository documentRepository) {
        this.embeddingStore = embeddingStore;
        this.embeddingModel = embeddingModel;
        this.documentRepository = documentRepository;
    }

    @Async
    @Transactional(readOnly = true)
    public void ingestDocumentIntoQdrant(Long documentId) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document introuvable: " + documentId));

        if (doc.getFileData() == null || doc.getFileData().length == 0) {
            throw new IllegalArgumentException("Le document ne contient pas de données binaires.");
        }

        // 1. Parsing du fichier (PDF, Word, etc.) via Apache Tika
        DocumentParser parser = new ApacheTikaDocumentParser();
        dev.langchain4j.data.document.Document lcDocument = parser.parse(new ByteArrayInputStream(doc.getFileData()));

        // 2. Ajout des métadonnées (Metadata pour le filtrage ultérieur)
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

        // 3. Ingestion dans Qdrant (Découpage + Vectorisation)
        // On découpe en blocs de 500 caractères avec un chevauchement de 50 caractères
        EmbeddingStoreIngestor ingestor = EmbeddingStoreIngestor.builder()
                .documentSplitter(DocumentSplitters.recursive(500, 50))
                .embeddingModel(embeddingModel)
                .embeddingStore(embeddingStore)
                .build();

        ingestor.ingest(lcDocument);
    }

    @Transactional(readOnly = true)
    public void ingestDocumentIntoQdrantSync(Long documentId) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document introuvable: " + documentId));

        if (doc.getFileData() == null || doc.getFileData().length == 0) {
            throw new IllegalArgumentException("Le document ne contient pas de données binaires.");
        }

        DocumentParser parser = new ApacheTikaDocumentParser();
        dev.langchain4j.data.document.Document lcDocument = parser.parse(new ByteArrayInputStream(doc.getFileData()));

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
