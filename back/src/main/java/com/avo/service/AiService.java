package com.avo.service;

import com.avo.service.ai.AvoAiTools;
import com.avo.service.ai.Pays;
import com.avo.service.ai.Prompts;
import com.avo.audit.AuditAction;
import com.avo.audit.AuditOutcome;
import com.avo.audit.AuditService;
import com.avo.service.ai.sources.AiAnswer;
import com.avo.service.ai.sources.CitationVerifier;
import com.avo.service.ai.sources.SourceRef;
import com.avo.service.ai.sources.SourceRegistry;
import com.avo.service.ai.sources.VerificationReport;
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
    private final SourceRegistry sourceRegistry;
    private final CitationVerifier citationVerifier;
    private final AuditService auditService;

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
            @Qualifier("aiStreamingExecutor") TaskExecutor aiStreamingExecutor,
            SourceRegistry sourceRegistry,
            CitationVerifier citationVerifier,
            AuditService auditService) {
        this.avoAiTools = avoAiTools;
        this.ragDocumentService = ragDocumentService;
        this.dossierRepository = dossierRepository;
        this.aiConfigurationService = aiConfigurationService;
        this.prompts = prompts;
        this.aiStreamingExecutor = aiStreamingExecutor;
        this.sourceRegistry = sourceRegistry;
        this.citationVerifier = citationVerifier;
        this.auditService = auditService;
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

    /**
     * Assistant général : le modèle peut appeler les outils de AvoAiTools (clients, factures, AML...).
     *
     * @param pays droit applicable choisi par l'avocat dans l'écran (null : détecté dans la question, France
     *             par défaut). Si le modèle cherche de la jurisprudence, c'est dans ce droit uniquement.
     */
    public AiAnswer chat(String sessionId, String userMessage, String pays) {
        return chatWithTools("assistant-system", sessionId, userMessage, choisirPays(pays, userMessage), false);
    }

    /**
     * Avocat senior. La base légale du droit choisi (jurisprudence + législation du pays + international) est
     * recherchée AVANT l'appel au modèle et jointe à la question : les modèles locaux n'appellent pas toujours
     * leurs outils, et une réponse juridique sans source consultée n'est pas acceptable. Les outils restent
     * disponibles pour les recherches complémentaires (pièces d'un dossier, fiches...).
     *
     * @param pays droit applicable choisi par l'avocat (null : détecté dans la question, France par défaut)
     */
    public AiAnswer analyzeDossierStrategy(String sessionId, String prompt, String pays) {
        return chatWithTools("avocat-senior-system", sessionId, prompt, choisirPays(pays, prompt), true);
    }

    /** Pays choisi dans l'écran s'il est géré, sinon celui mentionné dans la question, sinon FRANCE. */
    private static String choisirPays(String paysChoisi, String question) {
        String pays = Pays.normalizeOrNull(paysChoisi);
        return pays != null ? pays : Pays.detect(question);
    }

    /**
     * Appel avec outils : chaque source lue par un outil est inscrite au registre (S1, S2...), puis la réponse
     * est vérifiée par le code (citations, références juridiques, guillemets) avant d'être renvoyée.
     * Le droit applicable est imposé pour toute la réponse (AiJurisdiction) : l'outil de jurisprudence ne peut
     * pas chercher ailleurs, même si le modèle le demande.
     *
     * @param preRetrieval true : la base légale du pays est recherchée par le logiciel avant l'appel et jointe
     *                     à la question
     */
    private AiAnswer chatWithTools(String systemPrompt, String sessionId, String userMessage, String pays,
            boolean preRetrieval) {
        String conversationId = memoryKey(sessionId);
        List<String> perimetre = Pays.perimetre(pays);
        sourceRegistry.open();
        com.avo.service.ai.sources.AiJurisdiction.set(pays);
        try {
            StringBuilder fullMessage = new StringBuilder(userMessage)
                    .append("\n\nDROIT APPLICABLE CHOISI PAR L'AVOCAT : ").append(String.join(" + ", perimetre))
                    .append(". Raisonne uniquement dans ce droit.");
            if (preRetrieval) {
                String passages = avoAiTools.searchJurisprudence(pays, userMessage);
                if (passages.startsWith("[S")) {
                    fullMessage.append("\n\nEXTRAITS DE LA BASE LÉGALE DU CABINET (cite-les avec leur identifiant) :\n")
                            .append(passages);
                }
            }
            String content = chatClient().prompt()
                    .system(prompts.render(systemPrompt) + "\n\n" + prompts.render("regles-citation"))
                    .user(fullMessage.toString())
                    .tools(avoAiTools)
                    .advisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
                    .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
                    .call().content();
            List<SourceRef> sources = sourceRegistry.snapshot();
            return verified(content, sources, perimetre);
        } finally {
            com.avo.service.ai.sources.AiJurisdiction.clear();
            sourceRegistry.close();
        }
    }

    /** Vérifie la réponse et trace son verdict dans le journal d'audit (preuve de ce que l'IA a affirmé). */
    private AiAnswer verified(String content, List<SourceRef> sources, List<String> perimetre) {
        VerificationReport report = citationVerifier.verify(content, sources);
        String unverified = report.references().stream()
                .filter(r -> "NON_VERIFIEE".equals(r.status()) || "INTROUVABLE".equals(r.status()))
                .map(VerificationReport.CheckedReference::text)
                .reduce((a, b) -> a + ", " + b).orElse("aucune");
        auditService.record(AuditAction.ACCES_IA, "REPONSE_IA", null, AuditOutcome.SUCCES,
                "Réponse " + report.status() + " · droit " + String.join(" + ", perimetre) + " · "
                        + sources.size() + " source(s) consultée(s), " + report.citedSources().size()
                        + " citée(s) · références non vérifiées : " + unverified);
        return new AiAnswer(content, sources, report, perimetre);
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
            // Droit applicable = pays de juridiction du dossier. Non défini : on n'analyse pas (on ne devine pas
            // le droit applicable) et on demande à l'avocat de le renseigner.
            String pays = paysDuDossier(dossierId);
            if (pays == null) {
                sendEvent(emitter, "PAYS_MANQUANT", Map.of("message",
                        "Le pays de juridiction du dossier n'est pas défini : renseignez-le dans la fiche du dossier "
                                + "pour que l'analyse s'appuie sur le bon droit."));
                emitter.complete();
                return;
            }
            List<String> perimetre = Pays.perimetre(pays);
            sourceRegistry.open();
            try {
                String documents = avoAiTools.searchDocumentsInDossier(dossierId,
                        "faits importants, clauses, failles, enjeux, risques");
                String jurisprudence = avoAiTools.searchJurisprudence(pays, "lois applicables, arguments de défense");
                String prompt = prompts.render("strategie",
                        "pays", String.join(" + ", perimetre), "documents", documents, "jurisprudence", jurisprudence,
                        "regles", prompts.render("regles-citation"));
                // Le flux se termine sur un autre thread : on capture les sources maintenant
                List<SourceRef> sources = sourceRegistry.snapshot();

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
                            AiAnswer verifiedAnswer = verified(fullText.toString(), sources, perimetre);
                            saveStrategy(dossierId, fullText.toString(), verifiedAnswer);
                            sendVerification(emitter, verifiedAnswer);
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
            } finally {
                sourceRegistry.close();
            }
        });
    }

    /** Événement SSE « SOURCES » : sources consultées et verdict, envoyé juste avant « DONE ». */
    private static void sendVerification(SseEmitter emitter, AiAnswer answer) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("sources", answer.sources());
        body.put("verification", answer.verification());
        body.put("perimetre", answer.perimetre());
        sendEvent(emitter, "SOURCES", body);
    }

    /** Événement SSE nommé, au format JSON. */
    private static void sendEvent(SseEmitter emitter, String name, Object body) {
        try {
            byte[] json = JSON.writeValueAsString(body).getBytes(StandardCharsets.UTF_8);
            emitter.send(SseEmitter.event().name(name).data(json, MediaType.APPLICATION_JSON));
        } catch (Exception e) {
            // Client déconnecté : on ignore
        }
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

    private void saveStrategy(Long dossierId, String strategy, AiAnswer verifiedAnswer) {
        if (strategy.isBlank()) {
            return;
        }
        String sourcesJson = null;
        if (verifiedAnswer != null) {
            try {
                Map<String, Object> payload = new LinkedHashMap<>();
                payload.put("sources", verifiedAnswer.sources());
                payload.put("verification", verifiedAnswer.verification());
                payload.put("perimetre", verifiedAnswer.perimetre());
                sourcesJson = JSON.writeValueAsString(payload);
            } catch (Exception e) {
                log.error("Erreur sérialisation des sources de stratégie du dossier {}", dossierId, e);
            }
        }
        final String finalSourcesJson = sourcesJson;
        dossierRepository.findById(dossierId).ifPresent(dossier -> {
            dossier.setAiStrategy(strategy);
            dossier.setAiStrategySources(finalSourcesJson);
            dossierRepository.save(dossier);
        });
    }

    /** Droit applicable : le pays de juridiction du dossier, ou null s'il n'est pas défini (« à définir »). */
    private String paysDuDossier(Long dossierId) {
        return dossierRepository.findById(dossierId)
                .map(com.avo.entities.Dossier::getPaysJuridiction)
                .map(Pays::normalizeOrNull)
                .orElse(null);
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
