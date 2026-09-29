package com.avo.service;

import com.avo.entities.AiConfiguration;
import com.avo.repositories.AiConfigurationRepository;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.model.openai.OpenAiStreamingChatModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.model.ollama.OllamaChatModel;
import dev.langchain4j.model.ollama.OllamaStreamingChatModel;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class AiConfigurationService {

    private final AiConfigurationRepository repository;

    public AiConfigurationService(AiConfigurationRepository repository) {
        this.repository = repository;
    }

    public boolean isAiEnabled() {
        return repository.findByIsActiveTrue().isPresent();
    }

    public AiConfiguration getActiveConfiguration() {
        return repository.findByIsActiveTrue().orElse(null);
    }

    public ChatLanguageModel buildChatModel() {
        AiConfiguration config = getActiveConfiguration();
        if (config == null) {
            throw new IllegalStateException("L'Intelligence Artificielle est actuellement désactivée.");
        }
        Duration timeout = Duration.ofMinutes(config.getTimeoutMinutes() != null ? config.getTimeoutMinutes() : 15);
        double temp = config.getTemperature() != null ? config.getTemperature() : 0.3;

        switch (config.getProvider().toUpperCase()) {
            case "OPENAI":
                return OpenAiChatModel.builder()
                        .apiKey(config.getApiKey())
                        .modelName(config.getModelName())
                        .temperature(temp)
                        .timeout(timeout)
                        .build();
            case "GEMINI":
                return GoogleAiGeminiChatModel.builder()
                        .apiKey(config.getApiKey())
                        .modelName(config.getModelName())
                        .temperature(temp)
                        .build();
            case "OLLAMA":
            default:
                return OllamaChatModel.builder()
                        .baseUrl(config.getBaseUrl())
                        .modelName(config.getModelName())
                        .temperature(temp)
                        .timeout(timeout)
                        .build();
        }
    }

    public StreamingChatLanguageModel buildStreamingChatModel() {
        AiConfiguration config = getActiveConfiguration();
        if (config == null) {
            throw new IllegalStateException("L'Intelligence Artificielle est actuellement désactivée.");
        }
        Duration timeout = Duration.ofMinutes(config.getTimeoutMinutes() != null ? config.getTimeoutMinutes() : 15);
        double temp = config.getTemperature() != null ? config.getTemperature() : 0.3;

        switch (config.getProvider().toUpperCase()) {
            case "OPENAI":
                return OpenAiStreamingChatModel.builder()
                        .apiKey(config.getApiKey())
                        .modelName(config.getModelName())
                        .temperature(temp)
                        .timeout(timeout)
                        .build();
            case "GEMINI":
                return dev.langchain4j.model.googleai.GoogleAiGeminiStreamingChatModel.builder()
                        .apiKey(config.getApiKey())
                        .modelName(config.getModelName())
                        .temperature(temp)
                        .build();
            case "OLLAMA":
            default:
                return OllamaStreamingChatModel.builder()
                        .baseUrl(config.getBaseUrl())
                        .modelName(config.getModelName())
                        .temperature(temp)
                        .timeout(timeout)
                        .build();
        }
    }
}
