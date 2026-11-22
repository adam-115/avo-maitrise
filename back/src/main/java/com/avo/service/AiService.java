package com.avo.service;

import com.avo.service.ai.AvoAiTools;
import com.avo.service.ai.Pays;
import com.avo.service.ai.Prompts;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.ChatMemoryRepository;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskExecutor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Tous les usages de l'IA. Un seul principe : charger un prompt (fichier prompts/*.txt),
 * y ajouter le contexte utile, puis appeler le modèle actif via ChatClient (Spring AI).
 */
@Service
public class AiService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AiService.class);
    private static final ObjectMapper JSON = new ObjectMapper();

    private static final int MAX_MESSAGES_PER_SESSION = 20;
    private static final int MAX_SESSIONS = 500;

    private final AvoAiTools avoAiTools;
    private final com.avo.service.ai.RAGDocumentService ragDocumentService;
    private final com.avo.repositories.DossierRepository dossierRepository;
    private final AiConfigurationService aiConfigurationService;
    private final Prompts prompts;
    private final TaskExecutor aiStreamingExecutor;

    /** Mémoire des conversations du chat général (20 derniers messages, 500 conversations max). */
    private final ChatMemory chatMemory = MessageWindowChatMemory.builder()
            .chatMemoryRepository(new BoundedChatMemoryRepository(MAX_SESSIONS))
            .maxMessages(MAX_MESSAGES_PER_SESSION)
            .build();

    public AiService(AvoAiTools avoAiTools,
            com.avo.service.ai.RAGDocumentService ragDocumentService,
            com.avo.repositories.DossierRepository dossierRepository,
            AiConfigurationService aiConfigurationService,
            Prompts prompts,
            @Qualifier("aiStreamingExecutor") TaskExecutor aiStreamingExecutor) {
        this.avoAiTools = avoAiTools;
        this.ragDocumentService = ragDocumentService;
        this.dossierRepository = dossierRepository;
        this.aiConfigurationService = aiConfigurationService;
        this.prompts = prompts;
        this.aiStreamingExecutor = aiStreamingExecutor;
    }

    /** Client de chat sur le modèle actuellement configuré en base. */
    private ChatClient chatClient() {
        return ChatClient.create(aiConfigurationService.buildChatModel());
    }

    // ------------------------------------------------------------------ Prompts simples

    public String summarizeText(String text) {
        return chatClient().prompt()
                .user(prompts.render("resume", "texte", text))
                .call().content();
    }

    public String draftDocument(String context, String documentType) {
        return chatClient().prompt()
                .user(prompts.render("redaction", "type", documentType, "contexte", context))
                .call().content();
    }

    // ------------------------------------------------------------------ Assistant avec outils

    /** Assistant général : le modèle peut appeler les outils de AvoAiTools (clients, factures, AML...). */
    public String chat(String sessionId, String userMessage) {
        return chatWithTools("assistant-system", sessionId, userMessage);
    }

    /** Avocat senior : le modèle cherche lui-même dans les pièces et la jurisprudence (synchrone). */
    public String analyzeDossierStrategy(String sessionId, String prompt) {
        return chatWithTools("avocat-senior-system", sessionId, prompt);
    }

    private String chatWithTools(String systemPrompt, String sessionId, String userMessage) {
        String conversationId = memoryKey(sessionId);
        return chatClient().prompt()
                .system(prompts.render(systemPrompt))
                .user(userMessage)
                .tools(avoAiTools)
                .advisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
                .call().content();
    }

    /**
     * Clé de mémoire = utilisateur connecté + sessionId : deux utilisateurs qui enverraient le même
     * sessionId ne partagent jamais leur historique.
     */
    private String memoryKey(String sessionId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String user = (auth != null && auth.getName() != null) ? auth.getName() : "anonymous";
        return user + ":" + sessionId;
    }

    // ------------------------------------------------------------------ Stratégie d'un dossier

    /**
     * Questions de suivi sur la stratégie : la stratégie sauvegardée sert de contexte (message système),
     * l'historique est envoyé par le front. La réponse est ajoutée à l'historique en base.
     */
    public String chatDossierStrategy(Long dossierId, List<Map<String, String>> history) {
        com.avo.entities.Dossier dossier = dossierRepository.findById(dossierId).orElse(null);
        String strategy = (dossier != null && dossier.getAiStrategy() != null) ? dossier.getAiStrategy() : "";

        List<Message> messages = new ArrayList<>();
        messages.add(new SystemMessage(prompts.render("suivi-strategie-system", "strategie", strategy)));
        for (Map<String, String> msg : history) {
            if ("user".equals(msg.get("role"))) {
                messages.add(new UserMessage(msg.get("content")));
            } else if ("ai".equals(msg.get("role"))) {
                messages.add(new AssistantMessage(msg.get("content")));
            }
        }

        String reply = aiConfigurationService.buildChatModel().call(new Prompt(messages)).getResult().getOutput()
                .getText();

        if (dossier != null) {
            List<Map<String, String>> updatedHistory = new ArrayList<>(history);
            updatedHistory.add(Map.of("role", "ai", "content", reply));
            try {
                dossier.setAiChatHistory(JSON.writeValueAsString(updatedHistory));
                dossierRepository.save(dossier);
            } catch (Exception e) {
                log.error("Erreur sauvegarde historique chat du dossier {}", dossierId, e);
            }
        }
        return reply;
    }

    /**
     * Analyse stratégique en streaming (SSE).
     * 1. Le backend cherche lui-même les passages utiles (pièces du dossier + jurisprudence du pays).
     * 2. Il construit le prompt "strategie".
     * 3. Le modèle répond en flux : chaque morceau est envoyé au front, puis la réponse complète
     *    est sauvegardée dans le dossier.
     */
    public void analyzeDossierStrategyStream(Long dossierId, SseEmitter emitter) {
        aiStreamingExecutor.execute(() -> {
            try {
                String pays = paysDuDossier(dossierId);
                String documents = avoAiTools.searchDocumentsInDossier(dossierId,
                        "faits importants, clauses, failles, enjeux, risques");
                String jurisprudence = avoAiTools.searchJurisprudence(pays, "lois applicables, arguments de défense");
                String prompt = prompts.render("strategie",
                        "pays", pays, "documents", documents, "jurisprudence", jurisprudence);

                StringBuilder fullText = new StringBuilder();
                chatClient().prompt().user(prompt).stream().content().subscribe(
                        token -> {
                            fullText.append(token);
                            sendToken(emitter, token);
                        },
                        error -> {
                            log.error("Erreur streaming analyse stratégique du dossier {}", dossierId, error);
                            emitter.completeWithError(error);
                        },
                        () -> {
                            saveStrategy(dossierId, fullText.toString());
                            try {
                                emitter.send(SseEmitter.event().name("DONE").data("[DONE]"));
                                emitter.complete();
                            } catch (Exception e) {
                                emitter.completeWithError(e);
                            }
                        });
            } catch (Exception e) {
                log.error("Erreur analyse stratégique du dossier {}", dossierId, e);
                emitter.completeWithError(e);
            }
        });
    }

    /** Le token est encapsulé en JSON pour que les sauts de ligne passent correctement en SSE. */
    private static void sendToken(SseEmitter emitter, String token) {
        try {
            byte[] json = JSON.writeValueAsString(Map.of("token", token)).getBytes(StandardCharsets.UTF_8);
            emitter.send(SseEmitter.event().data(json, MediaType.APPLICATION_JSON));
        } catch (Exception e) {
            // Client déconnecté : on ignore
        }
    }

    private void saveStrategy(Long dossierId, String strategy) {
        if (strategy.isBlank()) {
            return;
        }
        dossierRepository.findById(dossierId).ifPresent(dossier -> {
            dossier.setAiStrategy(strategy);
            dossierRepository.save(dossier);
        });
    }

    /** Pays du droit applicable : celui du client du dossier, FRANCE par défaut. */
    private String paysDuDossier(Long dossierId) {
        return dossierRepository.findById(dossierId)
                .map(d -> d.getClient() != null ? d.getClient().getPays() : null)
                .map(Pays::normalize)
                .orElse(Pays.PAR_DEFAUT);
    }

    // ------------------------------------------------------------------ Mémoire du chat

    /**
     * Stockage en mémoire des conversations, borné : au-delà de maxSessions, la conversation la moins
     * récemment utilisée est oubliée. (Pour garder l'historique après un redémarrage, remplacer par
     * le JdbcChatMemoryRepository de Spring AI.)
     */
    private static final class BoundedChatMemoryRepository implements ChatMemoryRepository {

        private final Map<String, List<Message>> conversations;

        BoundedChatMemoryRepository(int maxSessions) {
            this.conversations = Collections.synchronizedMap(new LinkedHashMap<>(16, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<String, List<Message>> eldest) {
                    return size() > maxSessions;
                }
            });
        }

        @Override
        public List<String> findConversationIds() {
            synchronized (conversations) {
                return new ArrayList<>(conversations.keySet());
            }
        }

        @Override
        public List<Message> findByConversationId(String conversationId) {
            List<Message> messages = conversations.get(conversationId);
            return messages == null ? new ArrayList<>() : new ArrayList<>(messages);
        }

        @Override
        public void saveAll(String conversationId, List<Message> messages) {
            conversations.put(conversationId, new ArrayList<>(messages));
        }

        @Override
        public void deleteByConversationId(String conversationId) {
            conversations.remove(conversationId);
        }
    }
}
