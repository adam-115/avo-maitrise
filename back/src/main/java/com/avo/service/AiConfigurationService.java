package com.avo.service;

import com.avo.entities.AiConfiguration;
import com.avo.repositories.AiConfigurationRepository;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.ai.ollama.api.OllamaApi;
import org.springframework.ai.ollama.api.OllamaChatOptions;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;

/**
 * Fabrique du modèle de chat à partir de la configuration active en base (table ai_configuration).
 *
 * Le modèle est reconstruit à chaque appel : un changement dans l'écran d'administration
 * s'applique immédiatement, sans redémarrer l'application.
 * Les embeddings, eux, ne passent pas par ici : ils utilisent toujours Ollama (configuration Spring AI).
 */
@Service
public class AiConfigurationService {

    /** Gemini expose une API compatible OpenAI : on la réutilise au lieu d'un module dédié. */
    private static final String GEMINI_OPENAI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";

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

    /**
     * @return le modèle de chat actif. Il sait répondre d'un bloc (call) ou en streaming (stream).
     * @throws IllegalStateException si aucune configuration n'est active (IA désactivée)
     */
    public ChatModel buildChatModel() {
        AiConfiguration config = getActiveConfiguration();
        if (config == null) {
            throw new IllegalStateException("L'Intelligence Artificielle est actuellement désactivée.");
        }
        Duration timeout = Duration.ofMinutes(config.getTimeoutMinutes() != null ? config.getTimeoutMinutes() : 15);
        double temperature = config.getTemperature() != null ? config.getTemperature() : 0.3;
        RestClient.Builder restClient = restClientWithTimeout(timeout);

        switch (config.getProvider().toUpperCase()) {
            case "OPENAI":
                return openAi(config.getApiKey(), null, config.getModelName(), temperature, restClient);
            case "GEMINI":
                return openAi(config.getApiKey(), GEMINI_OPENAI_BASE_URL, config.getModelName(), temperature,
                        restClient);
            case "OLLAMA":
            default:
                return OllamaChatModel.builder()
                        .ollamaApi(OllamaApi.builder()
                                .baseUrl(config.getBaseUrl())
                                .restClientBuilder(restClient)
                                .build())
                        .defaultOptions(OllamaChatOptions.builder()
                                .model(config.getModelName())
                                .temperature(temperature)
                                .build())
                        .build();
        }
    }

    private ChatModel openAi(String apiKey, String baseUrl, String model, double temperature,
            RestClient.Builder restClient) {
        OpenAiApi.Builder api = OpenAiApi.builder().apiKey(apiKey).restClientBuilder(restClient);
        if (baseUrl != null) {
            api.baseUrl(baseUrl).completionsPath("/chat/completions");
        }
        return OpenAiChatModel.builder()
                .openAiApi(api.build())
                .defaultOptions(OpenAiChatOptions.builder().model(model).temperature(temperature).build())
                .build();
    }

    /** Les analyses longues peuvent durer plusieurs minutes : délai de lecture configurable. */
    private static RestClient.Builder restClientWithTimeout(Duration timeout) {
        HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(30)).build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(timeout);
        return RestClient.builder().requestFactory(factory);
    }
}
