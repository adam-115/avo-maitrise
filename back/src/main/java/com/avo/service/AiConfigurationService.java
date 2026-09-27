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

    public AiConfiguration getActiveConfiguration() {
        return repository.findByIsActiveTrue().orElseGet(() -> {
            AiConfiguration fallback = new AiConfiguration();
            fallback.setProvider("OLLAMA");
            fallback.setModelName("qwen2.5:7b");
            fallback.setBaseUrl("http://127.0.0.1:11434");
            fallback.setTemperature(0.3);
            fallback.setTimeoutMinutes(15);
            return fallback;
        });
    }

    public ChatLanguageModel buildChatModel() {
        AiConfiguration config = getActiveConfiguration();
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
