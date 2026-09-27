package com.avo.service;

import com.avo.service.ai.LegalAssistant;
import com.avo.service.ai.AvoAiTools;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.service.AiServices;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;

@Service
public class AiService {

    private final ChatLanguageModel chatLanguageModel;
    private final AvoAiTools avoAiTools;
    private final dev.langchain4j.model.chat.StreamingChatLanguageModel streamingChatLanguageModel;
    private final dev.langchain4j.rag.content.retriever.ContentRetriever contentRetriever;
    private final com.avo.repositories.DossierRepository dossierRepository;
    private LegalAssistant legalAssistant;

    public AiService(ChatLanguageModel chatLanguageModel, 
                     dev.langchain4j.model.chat.StreamingChatLanguageModel streamingChatLanguageModel,
                     AvoAiTools avoAiTools,
            dev.langchain4j.rag.content.retriever.ContentRetriever contentRetriever,
            com.avo.repositories.DossierRepository dossierRepository) {
        this.chatLanguageModel = chatLanguageModel;
        this.streamingChatLanguageModel = streamingChatLanguageModel;
        this.avoAiTools = avoAiTools;
        this.contentRetriever = contentRetriever;
        this.dossierRepository = dossierRepository;
    }

    @PostConstruct
    public void init() {
        this.legalAssistant = AiServices.builder(LegalAssistant.class)
                .chatLanguageModel(chatLanguageModel)
                .tools(avoAiTools)
                // Activation de la mémoire de conversation (ChatMemory).
                // On garde en mémoire les 20 derniers messages pour chaque "sessionId".
                .chatMemoryProvider(memoryId -> dev.langchain4j.memory.chat.MessageWindowChatMemory.withMaxMessages(20))
                .build();
    }

    /**
     * Un cas d'usage : résumer un texte juridique long
     */
    public String summarizeText(String text) {
        String prompt = "Tu es un assistant juridique expert. Résume le texte suivant de manière professionnelle, " +
                "en faisant ressortir les points clés, les dates importantes et les enjeux. \n\nTexte :\n" + text;
        return chatLanguageModel.generate(prompt);
    }

    /**
     * Un cas d'usage : rédiger un brouillon de lettre ou de document
     */
    public String draftDocument(String context, String documentType) {
        String prompt = String.format("Tu es un avocat français rédigeant un document. " +
                "Rédige un(e) %s en utilisant le contexte suivant : %s. " +
                "Utilise un ton formel et juridique.", documentType, context);
        return chatLanguageModel.generate(prompt);
    }

    /**
     * Générique pour discuter avec l'IA en utilisant les Tools !
     */
    public String chat(String sessionId, String userMessage) {
        return legalAssistant.chat(sessionId, userMessage);
    }

    /**
     * Fait appel à l'agent 'Avocat Senior' pour analyser une stratégie (Synchrone - Déprécié)
     */
    public String analyzeDossierStrategy(String sessionId, String prompt) {
        return legalAssistant.analyzeStrategy(sessionId, prompt);
    }

    /**
     * Chat avec l'IA sur la base de la stratégie générée pour un dossier
     */
    public String chatDossierStrategy(Long dossierId, java.util.List<java.util.Map<String, String>> history) {
        com.avo.entities.Dossier dossier = dossierRepository.findById(dossierId).orElse(null);
        String strategy = "";
        if (dossier != null && dossier.getAiStrategy() != null) {
            strategy = dossier.getAiStrategy();
        }

        java.util.List<dev.langchain4j.data.message.ChatMessage> messages = new java.util.ArrayList<>();
        
        // System message avec le contexte
        String systemPrompt = "Tu es un avocat associé expert. Tu as analysé ce dossier et établi cette stratégie :\n\n" +
                              "### STRATÉGIE ###\n" + strategy + "\n### FIN STRATÉGIE ###\n\n" +
                              "Réponds aux questions de l'avocat en charge du dossier concernant cette stratégie de manière claire, " +
                              "concise, professionnelle et directement applicable.";
        messages.add(dev.langchain4j.data.message.SystemMessage.from(systemPrompt));

        // Historique
        for (java.util.Map<String, String> msg : history) {
            String role = msg.get("role");
            String content = msg.get("content");
            if ("user".equals(role)) {
                messages.add(dev.langchain4j.data.message.UserMessage.from(content));
            } else if ("ai".equals(role)) {
                messages.add(dev.langchain4j.data.message.AiMessage.from(content));
            }
        }

        dev.langchain4j.model.output.Response<dev.langchain4j.data.message.AiMessage> response = chatLanguageModel.generate(messages);
        return response.content().text();
    }

    /**
     * Nouveau mode d'analyse : Manuelle et en Streaming (Plus rapide et ne timeout pas)
     */
    public void analyzeDossierStrategyStream(Long dossierId, org.springframework.web.servlet.mvc.method.annotation.SseEmitter emitter) {
        new Thread(() -> {
            try {
                // 1. Récupération manuelle et rapide du contexte RAG (Bypass du Tool Calling lent de LLM)
                String documentsContext = avoAiTools.searchDocumentsInDossier(dossierId, "faits importants, clauses, failles, enjeux, risques");
                String jurisContext = avoAiTools.searchJurisprudence("FRANCE", "lois applicables, arguments de défense");

                // 2. Construction d'un prompt unique optimisé
                String prompt = String.format("Tu es un avocat associé senior très expérimenté, expert en stratégie contentieuse.\n" +
                        "Ton objectif est d'analyser les informations du dossier fourni et de proposer la meilleure stratégie pour GAGNER l'affaire.\n" +
                        "Structure TOUJOURS ta réponse EXACTEMENT en 7 parties avec ces titres précis (utiliser des balises markdown ###) :\n\n" +
                        "### Synthèse des enjeux\n" +
                        "### Analyse Jurisprudence\n" +
                        "### Les Failles et Risques\n" +
                        "### Analyse des chances\n" +
                        "### La Stratégie Gagnante\n" +
                        "### Workflow prévu\n" +
                        "### Tâches recommandées\n\n" +
                        "Pour l'Analyse Jurisprudence, explique les lois applicables et cite des affaires similaires si possible en te basant sur la base légale fournie.\n" +
                        "Pour l'Analyse des chances, réponds à la question : c'est combien la chance de gagner cette affaire ?\n" +
                        "Pour le Workflow prévu, réponds à la question : ça sera quoi le workflow (déroulement) de cette affaire, comment ça peut être ?\n\n" +
                        "CONTEXTE DU DOSSIER :\n%s\n\n" +
                        "BASE LÉGALE :\n%s\n\n" +
                        "Rédige maintenant l'analyse stratégique de façon très professionnelle :", documentsContext, jurisContext);

                // 3. Appel du modèle en Streaming
                streamingChatLanguageModel.generate(prompt, new dev.langchain4j.model.StreamingResponseHandler<dev.langchain4j.data.message.AiMessage>() {
                    @Override
                    public void onNext(String token) {
                        try {
                            // On envoie le token de texte encapsulé en JSON pour éviter les problèmes de sauts de ligne avec SSE
                            java.util.Map<String, String> data = new java.util.HashMap<>();
                            data.put("token", token);
                            String json = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(data);
                            emitter.send(org.springframework.web.servlet.mvc.method.annotation.SseEmitter.event()
                                .data(json.getBytes(java.nio.charset.StandardCharsets.UTF_8), org.springframework.http.MediaType.APPLICATION_JSON));
                        } catch (Exception e) {
                            // Client déconnecté, on ignore
                        }
                    }

                    @Override
                    public void onComplete(dev.langchain4j.model.output.Response<dev.langchain4j.data.message.AiMessage> response) {
                        try {
                            // On sauvegarde la réponse finale dans la base de données
                            if (response.content() != null && response.content().text() != null) {
                                String finalStrategy = response.content().text();
                                com.avo.entities.Dossier dossier = dossierRepository.findById(dossierId).orElse(null);
                                if (dossier != null) {
                                    dossier.setAiStrategy(finalStrategy);
                                    dossierRepository.save(dossier);
                                }
                            }
                            emitter.send(org.springframework.web.servlet.mvc.method.annotation.SseEmitter.event().name("DONE").data("[DONE]"));
                            emitter.complete();
                        } catch (Exception e) {
                            emitter.completeWithError(e);
                        }
                    }

                    @Override
                    public void onError(Throwable error) {
                        try {
                            emitter.completeWithError(error);
                        } catch (Exception e) {}
                    }
                });

            } catch (Exception e) {
                try {
                    emitter.completeWithError(e);
                } catch (Exception ignored) {}
            }
        }).start();
    }
}
