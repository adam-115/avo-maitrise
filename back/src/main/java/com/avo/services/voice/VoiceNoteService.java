package com.avo.services.voice;

import com.avo.entities.Dossier;
import com.avo.repositories.DossierRepository;
import com.avo.service.AiConfigurationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Traite une dictée vocale (compte-rendu d'audience ou note rapide) :
 * 1. Détecte automatiquement le dossier correspondant (référence, nom du client ou mots-clés du titre).
 * 2. Si l'IA est active (Ollama / OpenAI / Gemini configuré dans Administration), structure la dictée brute
 *    en compte-rendu juridique propre + titre + tâches/audience suggérées.
 * 3. Fonctionne toujours en mode dégradé propre si l'IA est désactivée.
 */
@Service
@Slf4j
public class VoiceNoteService {

    private static final DateTimeFormatter FR_DATETIME = DateTimeFormatter.ofPattern("dd/MM/yyyy 'à' HH:mm");

    public record DossierSuggestion(
            Long dossierId,
            String referenceInterne,
            String titre,
            String clientName,
            String reason
    ) {}

    public record StructuredVoiceNote(
            String title,
            String structuredContent,
            boolean aiEnhanced,
            List<String> suggestedTasks,
            String suggestedEventTitle,
            String suggestedEventDate,
            DossierSuggestion suggestedDossier
    ) {}

    private final DossierRepository dossierRepository;
    private final AiConfigurationService aiConfigurationService;
    private final ObjectMapper objectMapper;

    public VoiceNoteService(DossierRepository dossierRepository,
                            AiConfigurationService aiConfigurationService,
                            ObjectMapper objectMapper) {
        this.dossierRepository = dossierRepository;
        this.aiConfigurationService = aiConfigurationService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public DossierSuggestion suggestDossierFromTranscript(String transcript) {
        if (transcript == null || transcript.trim().length() < 3) return null;
        String normText = normalize(transcript);
        List<Dossier> dossiers = dossierRepository.findAll();

        Dossier best = null;
        int bestScore = 0;
        String bestReason = null;

        for (Dossier d : dossiers) {
            int score = 0;
            String reason = null;

            String ref = d.getReferenceInterne() != null ? normalize(d.getReferenceInterne()) : "";
            if (ref.length() >= 4 && normText.contains(ref)) {
                score += 100;
                reason = "Référence « " + d.getReferenceInterne() + " » mentionnée";
            }

            String clientName = d.getClient() != null && d.getClient().getDisplayName() != null
                    ? d.getClient().getDisplayName().trim() : "";
            if (!clientName.isBlank()) {
                String normClient = normalize(clientName);
                if (normClient.length() >= 4 && normText.contains(normClient)) {
                    score += 80;
                    reason = reason != null ? reason : "Client « " + clientName + " » mentionné";
                } else {
                    for (String token : normClient.split("\\s+")) {
                        if (token.length() >= 4 && normText.contains(token)) {
                            score += 45;
                            reason = reason != null ? reason : "Nom client « " + clientName + " » détecté";
                            break;
                        }
                    }
                }
            }

            String titre = d.getTitre() != null ? normalize(d.getTitre()) : "";
            if (!titre.isBlank()) {
                int matchedWords = 0;
                for (String w : titre.split("\\s+")) {
                    if (w.length() >= 5 && normText.contains(w)) {
                        matchedWords++;
                    }
                }
                if (matchedWords >= 2) {
                    score += matchedWords * 20;
                    reason = reason != null ? reason : "Mots-clés du titre « " + d.getTitre() + " »";
                }
            }

            if (score > bestScore) {
                bestScore = score;
                best = d;
                bestReason = reason;
            }
        }

        if (best == null || bestScore < 40) return null;
        String clientName = best.getClient() != null ? best.getClient().getDisplayName() : null;
        return new DossierSuggestion(best.getId(), best.getReferenceInterne(), best.getTitre(), clientName, bestReason);
    }

    @Transactional(readOnly = true)
    public StructuredVoiceNote structureTranscript(String transcript, Long dossierId) {
        if (transcript == null || transcript.trim().isBlank()) {
            throw new IllegalArgumentException("La transcription vocale est vide.");
        }
        String cleanRaw = transcript.trim();
        DossierSuggestion suggestion = dossierId == null ? suggestDossierFromTranscript(cleanRaw) : null;

        String defaultTitle = "Compte-rendu vocal du " + LocalDateTime.now().format(FR_DATETIME);
        if (!aiConfigurationService.isAiEnabled()) {
            return new StructuredVoiceNote(defaultTitle, cleanRaw, false, List.of(), null, null, suggestion);
        }

        try {
            ChatClient client = ChatClient.create(aiConfigurationService.buildChatModel());
            String prompt = """
                    Tu es l'assistant juridique d'un avocat qui vient de dicter une note vocale rapide (souvent en sortant d'une audience ou d'un rendez-vous).
                    Date d'aujourd'hui : %s.
                    Transforme cette dictée brute en un compte-rendu juridique clair, bien ponctué et structuré, sans inventer aucun fait.
                    Réponds UNIQUEMENT en JSON valide (sans bloc markdown ```json) avec cette structure exacte :
                    {
                      "title": "Titre court et précis (max 80 caractères)",
                      "structuredContent": "Compte-rendu rédigé proprement en français (avec puces - si pertinent)",
                      "suggestedTasks": ["Tâche concrète à faire si mentionnée dans la dictée"],
                      "suggestedEventTitle": "Titre d'audience/RDV si une date future est mentionnée, sinon null",
                      "suggestedEventDate": "YYYY-MM-DD si une date future précise est mentionnée, sinon null"
                    }

                    DICTÉE BRUTE :
                    %s
                    """.formatted(LocalDate.now(), cleanRaw);

            String rawJson = client.prompt().user(prompt).call().content();
            if (rawJson == null || rawJson.isBlank()) {
                return new StructuredVoiceNote(defaultTitle, cleanRaw, false, List.of(), null, null, suggestion);
            }

            String cleanedJson = extractJsonObject(rawJson);
            JsonNode node = objectMapper.readTree(cleanedJson);
            String title = node.path("title").asText(defaultTitle);
            if (title.isBlank()) title = defaultTitle;
            String content = node.path("structuredContent").asText(cleanRaw);
            if (content.isBlank()) content = cleanRaw;

            List<String> tasks = new ArrayList<>();
            if (node.path("suggestedTasks").isArray()) {
                for (JsonNode t : node.path("suggestedTasks")) {
                    String s = t.asText("").trim();
                    if (!s.isBlank()) tasks.add(s);
                }
            }
            String evTitle = node.hasNonNull("suggestedEventTitle") ? node.get("suggestedEventTitle").asText(null) : null;
            String evDate = node.hasNonNull("suggestedEventDate") ? node.get("suggestedEventDate").asText(null) : null;
            if ("null".equalsIgnoreCase(evTitle)) evTitle = null;
            if ("null".equalsIgnoreCase(evDate)) evDate = null;

            return new StructuredVoiceNote(title, content, true, tasks, evTitle, evDate, suggestion);
        } catch (Exception e) {
            log.warn("Structuration IA de la dictée vocale indisponible ({}), retour au texte brut.", e.getMessage());
            return new StructuredVoiceNote(defaultTitle, cleanRaw, false, List.of(), null, null, suggestion);
        }
    }

    private static String extractJsonObject(String raw) {
        String s = raw.trim();
        int first = s.indexOf('{');
        int last = s.lastIndexOf('}');
        if (first >= 0 && last > first) {
            return s.substring(first, last + 1);
        }
        return s;
    }

    private static String normalize(String raw) {
        if (raw == null) return "";
        return Normalizer.normalize(raw, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s-]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
