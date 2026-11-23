package com.avo.services.deadline;

import com.avo.dtos.DossierDeadlineDTO;
import com.avo.entities.DeadlineRule;
import com.avo.entities.Document;
import com.avo.entities.Dossier;
import com.avo.repositories.DocumentRepository;
import com.avo.repositories.DossierRepository;
import com.avo.service.AiConfigurationService;
import com.avo.service.ai.Pays;
import com.avo.services.MinioService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.reader.tika.TikaDocumentReader;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Phase 3 : Détection assistée par IA des délais potentiels à partir d'une pièce du dossier.
 *
 * <p>Séparation stricte des responsabilités (RCP) :</p>
 * <ul>
 *   <li>Le LLM ne calcule JAMAIS aucune date d'échéance : il extrait uniquement les faits
 *       (code de règle applicable + date de départ au format ISO YYYY-MM-DD + libellé de l'acte).</li>
 *   <li>Chaque proposition est ensuite calculée par {@link DossierDeadlineService#preview}
 *       (moteur déterministe Java) et renvoyée en brouillon non enregistré, à valider par l'avocat.</li>
 * </ul>
 */
@Service
@Slf4j
public class DeadlineExtractionAiService {

    private static final ObjectMapper JSON = new ObjectMapper();
    private static final Pattern JSON_ARRAY = Pattern.compile("\\[.*]", Pattern.DOTALL);

    private final DocumentRepository documentRepository;
    private final DossierRepository dossierRepository;
    private final MinioService minioService;
    private final AiConfigurationService aiConfigurationService;
    private final DossierDeadlineService deadlineService;

    public DeadlineExtractionAiService(DocumentRepository documentRepository,
                                       DossierRepository dossierRepository,
                                       MinioService minioService,
                                       AiConfigurationService aiConfigurationService,
                                       DossierDeadlineService deadlineService) {
        this.documentRepository = documentRepository;
        this.dossierRepository = dossierRepository;
        this.minioService = minioService;
        this.aiConfigurationService = aiConfigurationService;
        this.deadlineService = deadlineService;
    }

    public List<DossierDeadlineDTO> detectDeadlinesFromDocument(Long dossierId, Long documentId) {
        if (!aiConfigurationService.isAiEnabled()) {
            throw new IllegalStateException("L'Intelligence Artificielle est désactivée.");
        }
        Dossier dossier = dossierRepository.findById(dossierId)
                .orElseThrow(() -> new IllegalArgumentException("Dossier introuvable : " + dossierId));
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document introuvable : " + documentId));
        if (doc.getMinioObjectId() == null || doc.getMinioObjectId().isBlank()) {
            throw new IllegalArgumentException("Ce document ne contient pas de fichier exploitable.");
        }

        String pays = Pays.normalize(dossier.getPaysJuridiction());
        List<DeadlineRule> rules = deadlineService.getRules(pays);
        if (rules.isEmpty()) {
            return List.of();
        }

        String text = extractText(doc);
        if (text.isBlank()) {
            return List.of();
        }
        // Limite raisonnable pour le prompt
        String excerpt = text.length() > 6000 ? text.substring(0, 6000) : text;

        String rulesCatalog = rules.stream()
                .map(r -> "- " + r.getCode() + " : " + r.getLibelle() + " (" + r.getDescription() + ")")
                .collect(Collectors.joining("\n"));

        String prompt = """
                Tu es un assistant juridique spécialisé en procédure (%s).
                Analyse le document suivant et identifie UNIQUEMENT les dates factuelles déclenchant un délai légal parmi le catalogue de règles ci-dessous.
                NE CALCULE PAS LA DATE D'ÉCHÉANCE : extrais seulement le code de règle exact et la date de départ (YYYY-MM-DD).

                CATALOGUE DES RÈGLES :
                %s

                DOCUMENT (« %s ») :
                %s

                Réponds UNIQUEMENT par un tableau JSON valide (sans texte autour) de la forme :
                [{"ruleCode":"CODE_REGLE","dateDepart":"YYYY-MM-DD","triggerEventLabel":"Ex: Notification du licenciement le 14/10/2026"}]
                Si aucune date déclencheuse certaine n'est trouvée, réponds exactement : []
                """.formatted(pays, rulesCatalog, doc.getNomFichier(), excerpt);

        String raw = ChatClient.create(aiConfigurationService.buildChatModel())
                .prompt().user(prompt).call().content();

        return parseAndCompute(raw, dossierId, documentId, pays, rules);
    }

    private String extractText(Document doc) {
        try (InputStream in = minioService.getFileStream(doc.getMinioObjectId())) {
            if (in == null) return "";
            byte[] bytes = in.readAllBytes();
            return new TikaDocumentReader(new ByteArrayResource(bytes)).get().stream()
                    .map(org.springframework.ai.document.Document::getText)
                    .filter(t -> t != null && !t.isBlank())
                    .collect(Collectors.joining("\n\n"));
        } catch (Exception e) {
            log.error("Erreur extraction texte document #{}", doc.getId(), e);
            return "";
        }
    }

    private List<DossierDeadlineDTO> parseAndCompute(String raw, Long dossierId, Long documentId,
                                                     String pays, List<DeadlineRule> rules) {
        if (raw == null || raw.isBlank()) return List.of();
        Matcher m = JSON_ARRAY.matcher(raw);
        if (!m.find()) return List.of();

        Map<String, DeadlineRule> byCode = rules.stream()
                .collect(Collectors.toMap(DeadlineRule::getCode, r -> r, (a, b) -> a));

        List<DossierDeadlineDTO> proposals = new ArrayList<>();
        try {
            List<Map<String, String>> items = JSON.readValue(m.group(), new TypeReference<>() {});
            for (Map<String, String> item : items) {
                DeadlineRule rule = byCode.get(item.get("ruleCode"));
                String dateStr = item.get("dateDepart");
                if (rule == null || dateStr == null || dateStr.isBlank()) continue;
                try {
                    DossierDeadlineDTO req = new DossierDeadlineDTO();
                    req.setDossierId(dossierId);
                    req.setDocumentId(documentId);
                    req.setRuleId(rule.getId());
                    req.setPays(pays);
                    req.setDateDepart(LocalDate.parse(dateStr.trim()));
                    req.setTriggerEventLabel(item.getOrDefault("triggerEventLabel", "Détecté dans la pièce"));
                    DossierDeadlineDTO computed = deadlineService.preview(req);
                    computed.setDocumentId(documentId);
                    proposals.add(computed);
                } catch (Exception ex) {
                    log.debug("Proposition IA ignorée (date invalide {}) : {}", dateStr, ex.getMessage());
                }
            }
        } catch (Exception e) {
            log.warn("Impossible de parser la réponse JSON d'extraction de délais : {}", e.getMessage());
        }
        return proposals;
    }
}
