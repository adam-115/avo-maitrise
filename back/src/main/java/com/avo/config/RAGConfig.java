package com.avo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

/**
 * Pools de threads dédiés à l'IA.
 *
 * Le reste de l'infrastructure (modèle d'embedding Ollama, base vectorielle Qdrant) est créé
 * automatiquement par les starters Spring AI à partir de application.properties (spring.ai.*).
 * Le modèle de chat est construit par AiConfigurationService depuis la table ai_configuration.
 */
@Configuration
public class RAGConfig {

    @Bean(name = "aiIngestionExecutor")
    public TaskExecutor aiIngestionExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        // 1 à 2 threads : l'indexation ne doit pas saturer Ollama
        executor.setCorePoolSize(1);
        executor.setMaxPoolSize(2);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("AI-Ingest-");
        executor.initialize();
        return executor;
    }

    @Bean(name = "aiStreamingExecutor")
    public TaskExecutor aiStreamingExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        // Préparation des analyses stratégiques (recherches RAG) : nombre borné en parallèle
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("AI-Stream-");
        executor.initialize();
        return executor;
    }
}
