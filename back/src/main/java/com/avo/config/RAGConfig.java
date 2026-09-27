package com.avo.config;

import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.ollama.OllamaEmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.qdrant.QdrantEmbeddingStore;
import dev.langchain4j.data.segment.TextSegment;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;

@Configuration
public class RAGConfig {

    @Value("${langchain4j.ollama.chat-model.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${ai.qdrant.host:localhost}")
    private String qdrantHost;

    @Value("${ai.qdrant.port:6334}")
    private int qdrantPort;

    @Bean
    public EmbeddingModel embeddingModel() {
        // Modèle spécialisé dans la vectorisation (Embeddings)
        return OllamaEmbeddingModel.builder()
                .baseUrl(ollamaBaseUrl.replace("localhost", "127.0.0.1"))
                .modelName("nomic-embed-text") // Il faudra faire "ollama run nomic-embed-text"
                .timeout(java.time.Duration.ofMinutes(5)) // Augmentation du timeout
                .build();
    }

    @Bean
    public dev.langchain4j.model.chat.StreamingChatLanguageModel streamingChatLanguageModel() {
        return dev.langchain4j.model.ollama.OllamaStreamingChatModel.builder()
                .baseUrl(ollamaBaseUrl.replace("localhost", "127.0.0.1"))
                .modelName("qwen2.5:7b")
                .temperature(0.3)
                .timeout(java.time.Duration.ofMinutes(5))
                .build();
    }

    @Bean
    public EmbeddingStore<TextSegment> embeddingStore() {
        // Connexion à Qdrant
        return QdrantEmbeddingStore.builder()
                .host(qdrantHost)
                .port(qdrantPort)
                .collectionName("avo_docs_collection")
                .build();
    }

    @Bean
    public dev.langchain4j.rag.content.retriever.ContentRetriever contentRetriever(
            EmbeddingStore<TextSegment> embeddingStore, 
            EmbeddingModel embeddingModel) {
        
        // Le Retriever permet à l'IA de chercher dans Qdrant
        return dev.langchain4j.rag.content.retriever.EmbeddingStoreContentRetriever.builder()
                .embeddingStore(embeddingStore)
                .embeddingModel(embeddingModel)
                .maxResults(5) // Nombre de paragraphes/lois à remonter
                .minScore(0.6) // Pertinence minimum
                .build();
    }
}
