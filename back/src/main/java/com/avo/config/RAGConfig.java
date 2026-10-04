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

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(RAGConfig.class);

    @Value("${langchain4j.ollama.chat-model.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${ai.qdrant.host:localhost}")
    private String qdrantHost;

    @Value("${ai.qdrant.port:6334}")
    private int qdrantPort;

    @jakarta.annotation.PostConstruct
    public void initQdrantCollection() {
        try {
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            // L'API HTTP REST de Qdrant utilise par défaut le port 6333 (6334 est pour gRPC)
            int restPort = (qdrantPort == 6334) ? 6333 : qdrantPort;
            String baseUrl = "http://" + qdrantHost + ":" + restPort;
            String collectionUrl = baseUrl + "/collections/avo_docs_collection";

            try {
                // Vérifier si la collection existe
                org.springframework.http.ResponseEntity<String> response = restTemplate.getForEntity(collectionUrl, String.class);
                if (response.getStatusCode().is2xxSuccessful()) {
                    log.info("Qdrant collection 'avo_docs_collection' already exists.");
                    return;
                }
            } catch (org.springframework.web.client.HttpClientErrorException.NotFound e) {
                // La collection n'existe pas, on procède à la création
                log.info("Qdrant collection 'avo_docs_collection' not found. Creating it...");
            }

            // Création de la collection avec 768 dimensions (pour nomic-embed-text)
            java.util.Map<String, Object> vectors = new java.util.HashMap<>();
            vectors.put("size", 768);
            vectors.put("distance", "Cosine");
            
            java.util.Map<String, Object> requestBody = new java.util.HashMap<>();
            requestBody.put("vectors", vectors);

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            org.springframework.http.HttpEntity<java.util.Map<String, Object>> entity = new org.springframework.http.HttpEntity<>(requestBody, headers);

            restTemplate.exchange(collectionUrl, org.springframework.http.HttpMethod.PUT, entity, String.class);
            log.info("Qdrant collection 'avo_docs_collection' created successfully.");

        } catch (Exception e) {
            log.error("Could not initialize Qdrant collection: " + e.getMessage(), e);
        }
    }

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
    public dev.langchain4j.model.chat.ChatLanguageModel chatLanguageModel() {
        return dev.langchain4j.model.ollama.OllamaChatModel.builder()
                .baseUrl(ollamaBaseUrl.replace("localhost", "127.0.0.1"))
                .modelName("qwen2.5:7b")
                .temperature(0.3)
                .timeout(java.time.Duration.ofMinutes(15)) // 15 minutes timeout pour les chats très longs
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

    @Bean(name = "aiIngestionExecutor")
    public org.springframework.core.task.TaskExecutor aiIngestionExecutor() {
        org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor executor = new org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor();
        // Limiter strictement à 1 ou 2 threads pour ne pas saturer Ollama
        executor.setCorePoolSize(1);
        executor.setMaxPoolSize(2);
        // Les autres documents attendent sagement dans la file d'attente (jusqu'à 500 documents)
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("AI-Ingest-");
        executor.initialize();
        return executor;
    }
}
