package com.avo.services.documents;

import com.avo.entities.*;
import com.avo.entities.Document;
import com.avo.repositories.CabinetProfileRepository;
import com.avo.repositories.ClientRepository;
import com.avo.repositories.DocumentRepository;
import com.avo.repositories.DossierRepository;
import com.avo.service.AiConfigurationService;
import com.avo.services.MinioService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.xwpf.usermodel.*;
import org.apache.tika.Tika;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Génère un document juridique (.docx) pré-rempli avec les informations d'un
 * client (et du cabinet)
 * à partir d'un modèle issu de la Bibliothèque de Modèles Juridiques
 * (DocumentType.MODEL).
 *
 * Flux en 2 étapes :
 * 1. searchModels() : trouve les modèles pertinents dans la GED (via IA si
 * active + recherche lexicale/synonymes).
 * Si plusieurs modèles correspondent, l'avocat choisit celui qu'il souhaite
 * utiliser.
 * 2. generateDocument() : lit le modèle depuis MinIO, remplace les balises
 * directement dans le .docx si présent,
 * ou utilise l'IA pour remplir un modèle libre, puis renvoie le .docx et
 * l'archive optionnellement en GED client.
 */
@Service
@Slf4j
public class ClientDocumentGeneratorService {

    private static final DateTimeFormatter FR_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final Pattern PLACEHOLDER_PATTERN = Pattern
            .compile("(\\{\\{\\s*([A-Za-z0-9_.-]+)\\s*\\}\\}|\\[\\s*([A-Z0-9_.-]{2,})\\s*\\])");

    private static final Map<String, List<String>> LEGAL_SYNONYMS = Map.ofEntries(
            Map.entry("contrat", List.of("convention", "accord", "prestation", "bail", "contract", "pacte")),
            Map.entry("convention", List.of("contrat", "accord", "honoraire", "honoraires", "contract")),
            Map.entry("honoraire", List.of("convention", "tarif", "facturation", "contrat")),
            Map.entry("procuration", List.of("mandat", "pouvoir", "representation")),
            Map.entry("mandat", List.of("procuration", "pouvoir", "representation")),
            Map.entry("kyc", List.of("conformite", "vigilance", "aml", "client", "attestation")),
            Map.entry("demeure", List.of("sommation", "relance", "impaye", "recouvrement")),
            Map.entry("lettre", List.of("courrier", "notification", "correspondance")),
            Map.entry("bail", List.of("location", "loyer", "contrat")),
            Map.entry("statut", List.of("societe", "constitution", "sarl", "sas")));

    public record ModelCandidate(
            Long id,
            String title,
            String nomFichier,
            String description,
            String tags,
            String reason,
            boolean recommended) {
    }

    public record ModelSearchResult(
            boolean aiUsed,
            int totalModelsInLibrary,
            String assistantMessage,
            List<ModelCandidate> matches,
            List<ModelCandidate> allModels) {
    }

    public record GeneratedDocumentResult(
            byte[] docxBytes,
            String filename,
            String generationMode, // DOCX_TEMPLATE | AI_FILLED | TEXT_TEMPLATE
            Long archivedDocumentId) {
    }

    private final DocumentRepository documentRepository;
    private final ClientRepository clientRepository;
    private final DossierRepository dossierRepository;
    private final CabinetProfileRepository cabinetProfileRepository;
    private final MinioService minioService;
    private final AiConfigurationService aiConfigurationService;
    private final ObjectMapper objectMapper;

    public ClientDocumentGeneratorService(
            DocumentRepository documentRepository,
            ClientRepository clientRepository,
            DossierRepository dossierRepository,
            CabinetProfileRepository cabinetProfileRepository,
            MinioService minioService,
            AiConfigurationService aiConfigurationService,
            ObjectMapper objectMapper) {
        this.documentRepository = documentRepository;
        this.clientRepository = clientRepository;
        this.dossierRepository = dossierRepository;
        this.cabinetProfileRepository = cabinetProfileRepository;
        this.minioService = minioService;
        this.aiConfigurationService = aiConfigurationService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public ModelSearchResult searchModels(String prompt) {
        List<Document> models = safeList(documentRepository.findByTypeDocument(DocumentType.MODEL));
        List<ModelCandidate> allCandidates = models.stream()
                .map(d -> toCandidate(d, "Modèle de la bibliothèque", false))
                .toList();

        if (models.isEmpty()) {
            return new ModelSearchResult(
                    false,
                    0,
                    "Votre Bibliothèque de Modèles Juridiques ne contient encore aucun document. Ajoutez d'abord un modèle dans le menu « Modèles & GED ».",
                    List.of(),
                    List.of());
        }

        String cleanPrompt = prompt == null ? "" : prompt.trim();
        if (cleanPrompt.isBlank()) {
            return new ModelSearchResult(
                    false,
                    models.size(),
                    models.size()
                            + " modèle(s) disponible(s) dans votre bibliothèque. Choisissez celui que vous souhaitez générer :",
                    allCandidates,
                    allCandidates);
        }

        // 1. Recherche sémantique via IA si activée
        if (aiConfigurationService.isAiEnabled()) {
            try {
                ModelSearchResult aiRes = searchModelsWithAi(cleanPrompt, models, allCandidates);
                if (aiRes != null) {
                    return aiRes;
                }
            } catch (Exception e) {
                log.warn("Recherche IA de modèles indisponible ({}), bascule vers recherche lexicale.", e.getMessage());
            }
        }

        // 2. Fallback lexical + synonymes juridiques
        List<ModelCandidate> lexical = searchModelsLexically(cleanPrompt, models);
        String msg;
        if (lexical.isEmpty()) {
            msg = "Aucun modèle ne correspond exactement à « " + cleanPrompt + " ». Vous pouvez choisir parmi les "
                    + models.size() + " modèle(s) de votre bibliothèque ci-dessous :";
        } else if (lexical.size() == 1) {
            msg = "1 modèle correspondant trouvé dans votre bibliothèque : « " + lexical.get(0).title() + " ».";
        } else {
            msg = lexical.size()
                    + " modèles correspondent à votre demande. Veuillez choisir celui que vous souhaitez générer :";
        }

        return new ModelSearchResult(false, models.size(), msg, lexical, allCandidates);
    }

    @Transactional
    public GeneratedDocumentResult generateDocument(Long clientId, Long modelDocumentId, String instructions,
            boolean saveToClientGed) {
        return generateDocument(clientId, null, modelDocumentId, instructions, saveToClientGed);
    }

    @Transactional
    public GeneratedDocumentResult generateDocument(Long clientId, Long dossierId, Long modelDocumentId,
            String instructions, boolean saveToGed) {
        Dossier dossier = dossierId != null
                ? dossierRepository.findById(dossierId)
                        .orElseThrow(() -> new IllegalArgumentException("Dossier introuvable : " + dossierId))
                : null;

        ClientEntity client = null;
        if (clientId != null) {
            client = clientRepository.findById(clientId).orElse(null);
        }
        if (client == null && dossier != null) {
            client = dossier.getClient();
        }
        if (client == null && dossier == null) {
            throw new IllegalArgumentException("Client ou dossier introuvable.");
        }

        Document modelDoc = documentRepository.findById(modelDocumentId)
                .orElseThrow(() -> new IllegalArgumentException("Modèle de document introuvable : " + modelDocumentId));

        CabinetProfile cabinet = cabinetProfileRepository.findAll().stream().findFirst().orElse(null);
        Map<String, String> placeholders = buildPlaceholderMap(client, dossier, cabinet);
        String clientSummary = buildClientContextSummary(client, dossier, cabinet);

        byte[] rawBytes = loadModelBytes(modelDoc);
        String originalName = firstNonBlank(modelDoc.getNomFichier(), modelDoc.getFilename(), modelDoc.getTitle(),
                "modele.docx");
        boolean isDocx = originalName.toLowerCase(Locale.ROOT).endsWith(".docx");
        boolean hasExtraInstructions = instructions != null && !instructions.trim().isBlank();

        byte[] outputDocx;
        String mode;

        if (isDocx && rawBytes != null && rawBytes.length > 0) {
            int replacedCount = countDocxPlaceholders(rawBytes, placeholders);
            int emptyOrUnmappedCount = countEmptyOrUnmappedDocxPlaceholders(rawBytes, placeholders);
            if (replacedCount > 0 && emptyOrUnmappedCount == 0 && !hasExtraInstructions) {
                outputDocx = fillDocxInPlace(rawBytes, placeholders);
                mode = "DOCX_TEMPLATE";
            } else if (aiConfigurationService.isAiEnabled()) {
                String extracted = extractTextFromBytes(rawBytes, originalName);
                String aiText = fillWithAi(extracted, clientSummary, instructions, originalName);
                if (aiText != null && !aiText.isBlank()) {
                    outputDocx = buildFormattedDocx(firstNonBlank(modelDoc.getTitle(), stripExtension(originalName)),
                            aiText, cabinet);
                    mode = "AI_FILLED";
                } else {
                    outputDocx = fillDocxInPlace(rawBytes, placeholders);
                    mode = "DOCX_TEMPLATE";
                }
            } else {
                outputDocx = fillDocxInPlace(rawBytes, placeholders);
                mode = "DOCX_TEMPLATE";
            }
        } else {
            String extracted = rawBytes != null && rawBytes.length > 0
                    ? extractTextFromBytes(rawBytes, originalName)
                    : firstNonBlank(modelDoc.getDescription(), modelDoc.getTitle(), "Modèle juridique");
            String filledText = null;
            if (aiConfigurationService.isAiEnabled()) {
                filledText = fillWithAi(extracted, clientSummary, instructions, originalName);
            }
            if (filledText != null && !filledText.isBlank()) {
                mode = "AI_FILLED";
            } else {
                filledText = replacePlaceholdersInText(extracted, placeholders);
                mode = "TEXT_TEMPLATE";
            }
            outputDocx = buildFormattedDocx(firstNonBlank(modelDoc.getTitle(), stripExtension(originalName)),
                    filledText, cabinet);
        }

        String baseTitle = sanitizeFileName(stripExtension(firstNonBlank(modelDoc.getTitle(), originalName)));
        String targetSlug = dossier != null
                ? sanitizeFileName(firstNonBlank(dossier.getReferenceInterne(), "Dossier_" + dossier.getId()))
                : sanitizeFileName(
                        firstNonBlank(client != null ? client.getDisplayName() : null, "Client_" + clientId));
        String finalFilename = baseTitle + "_" + targetSlug + ".docx";

        Long archivedDocId = null;
        if (saveToGed) {
            archivedDocId = archiveGeneratedDoc(client, dossier, modelDoc, finalFilename, outputDocx);
        }

        return new GeneratedDocumentResult(outputDocx, finalFilename, mode, archivedDocId);
    }

    private ModelSearchResult searchModelsWithAi(String prompt, List<Document> models,
            List<ModelCandidate> allCandidates) throws Exception {
        StringBuilder catalog = new StringBuilder();
        Map<Long, Document> docById = new LinkedHashMap<>();
        for (Document d : models) {
            docById.put(d.getId(), d);
            catalog.append("- ID=").append(d.getId())
                    .append(" | Titre=")
                    .append(firstNonBlank(d.getTitle(), d.getName(), d.getNomFichier(), "Document #" + d.getId()))
                    .append(" | Fichier=").append(firstNonBlank(d.getNomFichier(), d.getFilename(), "-"))
                    .append(" | Tags=").append(nullSafe(d.getTags()))
                    .append(" | Description=").append(truncate(d.getDescription(), 140))
                    .append("\n");
        }

        String aiPrompt = """
                Tu es l'assistant documentaire d'un cabinet d'avocats.
                L'avocat demande : "%s"
                Voici les modèles disponibles dans sa Bibliothèque de Modèles Juridiques :
                %s

                Sélectionne TOUS les modèles pertinents (classés du plus pertinent au moins pertinent).
                Réponds UNIQUEMENT en JSON valide (sans bloc markdown ```json) avec cette structure exacte :
                {
                  "message": "Courte phrase en français adressée à l'avocat (si plusieurs modèles, lui demander lequel choisir)",
                  "matches": [
                    { "id": 12, "reason": "Raison courte en français" }
                  ]
                }
                """
                .formatted(prompt, catalog);

        ChatClient client = ChatClient.create(aiConfigurationService.buildChatModel());
        String raw = client.prompt().user(aiPrompt).call().content();
        if (raw == null || raw.isBlank())
            return null;

        JsonNode root = objectMapper.readTree(extractJsonObject(raw));
        List<ModelCandidate> matches = new ArrayList<>();
        Set<Long> seen = new HashSet<>();
        if (root.path("matches").isArray()) {
            boolean first = true;
            for (JsonNode m : root.path("matches")) {
                Long id = m.hasNonNull("id") ? m.get("id").asLong() : null;
                if (id != null && docById.containsKey(id) && seen.add(id)) {
                    String reason = m.path("reason").asText("Correspond à votre demande");
                    matches.add(toCandidate(docById.get(id), reason, first));
                    first = false;
                }
            }
        }

        String msg = root.path("message").asText("").trim();
        if (msg.isBlank()) {
            msg = matches.isEmpty()
                    ? "Aucun modèle ne correspond exactement. Vous pouvez sélectionner un modèle parmi toute la bibliothèque :"
                    : (matches.size() == 1
                            ? "Modèle trouvé : « " + matches.get(0).title() + " »."
                            : matches.size() + " modèles trouvés. Lequel souhaitez-vous utiliser ?");
        }
        return new ModelSearchResult(true, models.size(), msg, matches, allCandidates);
    }

    private List<ModelCandidate> searchModelsLexically(String prompt, List<Document> models) {
        Set<String> queryTokens = expandTokens(prompt);
        record Scored(Document doc, int score, String reason) {
        }
        List<Scored> scored = new ArrayList<>();

        for (Document d : models) {
            String title = firstNonBlank(d.getTitle(), d.getName(), d.getNomFichier(), "");
            String normTitle = normalize(title);
            String normFile = normalize(firstNonBlank(d.getNomFichier(), d.getFilename(), ""));
            String normTags = normalize(nullSafe(d.getTags()));
            String normDesc = normalize(nullSafe(d.getDescription()));

            int score = 0;
            List<String> hits = new ArrayList<>();
            for (String tok : queryTokens) {
                if (normTitle.contains(tok) || normFile.contains(tok)) {
                    score += 30;
                    hits.add(tok);
                } else if (normTags.contains(tok)) {
                    score += 20;
                    hits.add(tok);
                } else if (normDesc.contains(tok)) {
                    score += 10;
                    hits.add(tok);
                }
            }
            if (score > 0) {
                String reason = "Correspondance : "
                        + hits.stream().distinct().limit(3).reduce((a, b) -> a + ", " + b).orElse("mots-clés");
                scored.add(new Scored(d, score, reason));
            }
        }

        scored.sort((a, b) -> Integer.compare(b.score(), a.score()));
        List<ModelCandidate> result = new ArrayList<>();
        for (int i = 0; i < scored.size(); i++) {
            result.add(toCandidate(scored.get(i).doc(), scored.get(i).reason(), i == 0));
        }
        return result;
    }

    private String fillWithAi(String modelText, String clientSummary, String instructions, String modelName) {
        try {
            String clippedModel = modelText.length() > 14000 ? modelText.substring(0, 14000) : modelText;
            String prompt = """
                    Tu es un avocat rédacteur d'actes.
                    Génère le document juridique complet basé STRICTEMENT sur le MODÈLE fourni ci-dessous, en pré-remplissant toutes les informations du CLIENT et du CABINET.

                    Règles strictes :
                    1. Conserve la structure juridique, les clauses et les articles du modèle d'origine.
                    2. Remplace toutes les balises ({{...}}, [...]), les blancs (______, ......) et les noms d'exemple par les vraies données du CLIENT et du CABINET fournies ci-dessous.
                    3. ADAPTE LES MENTIONS AU TYPE DE CLIENT : si le client est une PERSONNE PHYSIQUE, supprime totalement les mentions propres aux sociétés (forme juridique, RC, IF, représentant légal) et utilise ses informations personnelles (nom, prénom, CIN, adresse). Si le client est une SOCIÉTÉ, supprime les mentions de CIN personnelle au profit du RC, IF, forme juridique et représentant légal.
                    4. Ne laisse AUCUNE balise {{...}} brute dans le texte final. Si une information métier manque (ex: montant spécifique d'honoraires), utilise [À compléter].
                    5. Applique les consignes supplémentaires de l'avocat si fournies et assure une rédaction juridique française impeccable (sans virgules orphelines ni parenthèses vides).
                    6. Retourne UNIQUEMENT le texte final du document prêt à être mis en forme Word (pas de commentaire d'introduction ni de conclusion).

                    === MODÈLE (%s) ===
                    %s

                    === INFORMATIONS DU CLIENT ET DU CABINET ===
                    %s

                    === CONSIGNES SUPPLÉMENTAIRES DE L'AVOCAT ===
                    %s
                    """
                    .formatted(
                            modelName,
                            clippedModel,
                            clientSummary,
                            (instructions != null && !instructions.isBlank()) ? instructions.trim()
                                    : "Aucune consigne supplémentaire.");

            ChatClient client = ChatClient.create(aiConfigurationService.buildChatModel());
            return client.prompt().user(prompt).call().content();
        } catch (Exception e) {
            log.warn("Remplissage IA du modèle impossible ({}), bascule vers remplacement de balises.", e.getMessage());
            return null;
        }
    }

    private byte[] loadModelBytes(Document doc) {
        if (doc.getMinioObjectId() == null || doc.getMinioObjectId().isBlank())
            return null;
        try (InputStream is = minioService.getFileStream(doc.getMinioObjectId())) {
            return is != null ? is.readAllBytes() : null;
        } catch (Exception e) {
            log.warn("Impossible de lire le modèle {} depuis MinIO : {}", doc.getId(), e.getMessage());
            return null;
        }
    }

    private String extractTextFromBytes(byte[] bytes, String filename) {
        try {
            if (filename.toLowerCase(Locale.ROOT).endsWith(".docx")) {
                try (XWPFDocument docx = new XWPFDocument(new ByteArrayInputStream(bytes))) {
                    StringBuilder sb = new StringBuilder();
                    for (XWPFParagraph p : docx.getParagraphs()) {
                        sb.append(p.getText()).append("\n");
                    }
                    for (XWPFTable table : docx.getTables()) {
                        for (XWPFTableRow row : table.getRows()) {
                            List<String> cells = new ArrayList<>();
                            for (XWPFTableCell cell : row.getTableCells()) {
                                cells.add(cell.getText().trim());
                            }
                            sb.append(String.join(" | ", cells)).append("\n");
                        }
                    }
                    return sb.toString();
                }
            }
            Tika tika = new Tika();
            return tika.parseToString(new ByteArrayInputStream(bytes));
        } catch (Exception e) {
            return new String(bytes, StandardCharsets.UTF_8);
        }
    }

    private int countDocxPlaceholders(byte[] bytes, Map<String, String> values) {
        try (XWPFDocument docx = new XWPFDocument(new ByteArrayInputStream(bytes))) {
            int count = 0;
            for (XWPFParagraph p : docx.getParagraphs()) {
                count += countMatchesInText(p.getText(), values);
            }
            for (XWPFTable t : docx.getTables()) {
                for (XWPFTableRow r : t.getRows()) {
                    for (XWPFTableCell c : r.getTableCells()) {
                        for (XWPFParagraph p : c.getParagraphs()) {
                            count += countMatchesInText(p.getText(), values);
                        }
                    }
                }
            }
            return count;
        } catch (Exception e) {
            return 0;
        }
    }

    private int countMatchesInText(String text, Map<String, String> values) {
        if (text == null || text.isBlank())
            return 0;
        Matcher m = PLACEHOLDER_PATTERN.matcher(text);
        int count = 0;
        while (m.find()) {
            String key = (m.group(2) != null ? m.group(2) : m.group(3)).toUpperCase(Locale.ROOT);
            String val = values.get(key);
            if (val != null && !val.isBlank())
                count++;
        }
        return count;
    }

    private int countEmptyOrUnmappedDocxPlaceholders(byte[] bytes, Map<String, String> values) {
        try (XWPFDocument docx = new XWPFDocument(new ByteArrayInputStream(bytes))) {
            int count = 0;
            for (XWPFParagraph p : docx.getParagraphs()) {
                count += countEmptyOrUnmappedInText(p.getText(), values);
            }
            for (XWPFTable t : docx.getTables()) {
                for (XWPFTableRow r : t.getRows()) {
                    for (XWPFTableCell c : r.getTableCells()) {
                        for (XWPFParagraph p : c.getParagraphs()) {
                            count += countEmptyOrUnmappedInText(p.getText(), values);
                        }
                    }
                }
            }
            return count;
        } catch (Exception e) {
            return 0;
        }
    }

    private int countEmptyOrUnmappedInText(String text, Map<String, String> values) {
        if (text == null || text.isBlank())
            return 0;
        Matcher m = PLACEHOLDER_PATTERN.matcher(text);
        int count = 0;
        while (m.find()) {
            // Ne compter que les balises {{...}} ou les clés connues (pas "[À compléter]")
            if (m.group(2) != null) {
                String key = m.group(2).toUpperCase(Locale.ROOT);
                String val = values.get(key);
                if (val == null || val.isBlank())
                    count++;
            }
        }
        return count;
    }

    private byte[] fillDocxInPlace(byte[] bytes, Map<String, String> values) {
        try (XWPFDocument docx = new XWPFDocument(new ByteArrayInputStream(bytes));
                ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            for (XWPFParagraph p : docx.getParagraphs()) {
                replaceInParagraph(p, values);
            }
            for (XWPFTable table : docx.getTables()) {
                for (XWPFTableRow row : table.getRows()) {
                    for (XWPFTableCell cell : row.getTableCells()) {
                        for (XWPFParagraph p : cell.getParagraphs()) {
                            replaceInParagraph(p, values);
                        }
                    }
                }
            }
            for (XWPFHeader header : docx.getHeaderList()) {
                for (XWPFParagraph p : header.getParagraphs())
                    replaceInParagraph(p, values);
            }
            for (XWPFFooter footer : docx.getFooterList()) {
                for (XWPFParagraph p : footer.getParagraphs())
                    replaceInParagraph(p, values);
            }

            docx.write(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Erreur lors du remplissage .docx en place", e);
            throw new RuntimeException("Impossible de générer le document Word : " + e.getMessage(), e);
        }
    }

    private void replaceInParagraph(XWPFParagraph paragraph, Map<String, String> values) {
        String original = paragraph.getText();
        if (original == null || original.isBlank())
            return;
        String replaced = replacePlaceholdersInText(original, values);
        if (replaced.equals(original))
            return;

        List<XWPFRun> runs = paragraph.getRuns();
        if (runs == null || runs.isEmpty()) {
            paragraph.createRun().setText(replaced);
            return;
        }
        // Conserver le style du premier run et supprimer les suivants
        XWPFRun first = runs.get(0);
        first.setText(replaced, 0);
        for (int i = runs.size() - 1; i >= 1; i--) {
            paragraph.removeRun(i);
        }
    }

    String replacePlaceholdersInText(String text, Map<String, String> values) {
        if (text == null || text.isBlank())
            return "";
        Matcher m = PLACEHOLDER_PATTERN.matcher(text);
        StringBuffer sb = new StringBuffer();
        while (m.find()) {
            boolean isCurly = m.group(2) != null;
            String key = (isCurly ? m.group(2) : m.group(3)).toUpperCase(Locale.ROOT);
            if (values.containsKey(key)) {
                m.appendReplacement(sb, Matcher.quoteReplacement(values.get(key)));
            } else if (isCurly) {
                // Ne jamais laisser une balise {{...}} brute dans le document final
                m.appendReplacement(sb, "");
            }
        }
        m.appendTail(sb);
        // Nettoyer la ponctuation orpheline éventuelle après suppression de champs
        // vides
        return sb.toString()
                .replaceAll("\\(\\s*\\)", "")
                .replaceAll(",\\s*,+", ",")
                .replaceAll("\\s{2,}", " ")
                .trim();
    }

    private byte[] buildFormattedDocx(String title, String content, CabinetProfile cabinet) {
        try (XWPFDocument doc = new XWPFDocument();
                ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            if (cabinet != null && cabinet.getName() != null && !cabinet.getName().isBlank()) {
                XWPFParagraph headerP = doc.createParagraph();
                headerP.setAlignment(ParagraphAlignment.RIGHT);
                XWPFRun hr = headerP.createRun();
                hr.setText(cabinet.getName());
                hr.setBold(true);
                hr.setFontSize(10);
                hr.setColor("4F46E5");
            }

            XWPFParagraph titleP = doc.createParagraph();
            titleP.setAlignment(ParagraphAlignment.CENTER);
            titleP.setSpacingAfter(240);
            XWPFRun tr = titleP.createRun();
            tr.setText(title);
            tr.setBold(true);
            tr.setFontSize(15);
            tr.setColor("1E293B");

            for (String line : content.split("\\r?\\n")) {
                String trimmed = line.trim();
                XWPFParagraph p = doc.createParagraph();
                if (trimmed.isEmpty()) {
                    p.setSpacingAfter(80);
                    continue;
                }
                if (trimmed.startsWith("### ") || trimmed.startsWith("## ") || trimmed.startsWith("# ")
                        || trimmed.matches("^(ARTICLE|CHAPITRE|SECTION)\\s+.*")) {
                    p.setSpacingBefore(180);
                    p.setSpacingAfter(80);
                    XWPFRun r = p.createRun();
                    r.setText(trimmed.replaceFirst("^#+\\s*", ""));
                    r.setBold(true);
                    r.setFontSize(12);
                    r.setColor("1E293B");
                } else {
                    p.setAlignment(ParagraphAlignment.BOTH);
                    p.setSpacingAfter(100);
                    XWPFRun r = p.createRun();
                    r.setText(trimmed.replace("**", ""));
                    r.setFontSize(11);
                }
            }

            doc.write(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Impossible de construire le fichier Word (.docx) : " + e.getMessage(), e);
        }
    }

    private Long archiveGeneratedDoc(ClientEntity client, Dossier dossier, Document modelDoc, String filename,
            byte[] docxBytes) {
        try (InputStream is = new ByteArrayInputStream(docxBytes)) {
            String objectId = minioService.uploadFile(
                    filename,
                    is,
                    docxBytes.length,
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
            Document saved = new Document();
            saved.setNomFichier(filename);
            saved.setFilename(filename);
            saved.setTitle(stripExtension(filename).replace('_', ' '));
            saved.setDescription("Document généré à partir du modèle « "
                    + firstNonBlank(modelDoc.getTitle(), modelDoc.getNomFichier(), "#" + modelDoc.getId()) + " »");
            saved.setTypeDocument(dossier != null ? DocumentType.DOSSIER : DocumentType.CLIENT);
            if (dossier != null) {
                saved.setDossier(dossier);
            }
            if (client != null) {
                saved.setClient(client);
            }
            saved.setMinioObjectId(objectId);
            saved.setDateUpload(LocalDateTime.now());
            saved.setEstValide(true);
            return documentRepository.save(saved).getId();
        } catch (Exception e) {
            log.warn("Archivage GED du document généré échoué ({}), téléchargement seul effectué.", e.getMessage());
            return null;
        }
    }

    Map<String, String> buildPlaceholderMap(ClientEntity client, Dossier dossier, CabinetProfile cabinet) {
        Map<String, String> map = new LinkedHashMap<>();
        String displayName = client != null ? firstNonBlank(client.getDisplayName(), "") : "";
        map.put("CLIENT_NOM", displayName);
        map.put("NOM_CLIENT", displayName);
        map.put("NOM_COMPLET", displayName);
        map.put("CLIENT_EMAIL", client != null ? nullSafe(client.getEmail()) : "");
        map.put("EMAIL", client != null ? nullSafe(client.getEmail()) : "");
        map.put("CLIENT_TELEPHONE", client != null ? nullSafe(client.getTelephone()) : "");
        map.put("TELEPHONE", client != null ? nullSafe(client.getTelephone()) : "");
        map.put("CLIENT_ADRESSE", client != null ? nullSafe(client.getAdresse()) : "");
        map.put("ADRESSE", client != null ? nullSafe(client.getAdresse()) : "");
        map.put("CLIENT_PAYS", client != null ? nullSafe(client.getPays()) : "");
        map.put("PAYS", client != null ? nullSafe(client.getPays()) : "");
        map.put("SECTEUR_ACTIVITE", client != null ? nullSafe(client.getSecteurActivite()) : "");
        map.put("DATE", LocalDate.now().format(FR_DATE));
        map.put("DATE_JOUR", LocalDate.now().format(FR_DATE));

        // Champs Dossier
        map.put("DOSSIER_REF", dossier != null ? nullSafe(dossier.getReferenceInterne()) : "");
        map.put("REFERENCE_DOSSIER", dossier != null ? nullSafe(dossier.getReferenceInterne()) : "");
        map.put("DOSSIER_TITRE", dossier != null ? nullSafe(dossier.getTitre()) : "");
        map.put("DOSSIER_DESCRIPTION", dossier != null ? nullSafe(dossier.getDescription()) : "");
        map.put("DOMAINE_JURIDIQUE", dossier != null ? nullSafe(dossier.getDomaineJuridique()) : "");
        map.put("PAYS_JURIDICTION", dossier != null ? nullSafe(dossier.getPaysJuridiction()) : "");
        map.put("DATE_OUVERTURE", (dossier != null && dossier.getDateOuverture() != null)
                ? dossier.getDateOuverture().toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate()
                        .format(FR_DATE)
                : "");
        String partiesStr = "";
        if (dossier != null && dossier.getAutresParties() != null && !dossier.getAutresParties().isEmpty()) {
            partiesStr = dossier.getAutresParties().stream()
                    .map(p -> p.getPartie() != null ? nullSafe(p.getPartie().getDisplayName()) : "")
                    .filter(s -> !s.isBlank())
                    .reduce((a, b) -> a + ", " + b).orElse("");
        }
        map.put("PARTIES_ADVERSES", partiesStr);

        // Initialiser les champs spécifiques à vide par défaut pour éviter toute balise
        // non résolue
        map.put("NOM", "");
        map.put("PRENOM", "");
        map.put("CIN", "");
        map.put("NATIONALITE", "");
        map.put("DATE_NAISSANCE", "");
        map.put("NOM_COMMERCIAL", "");
        map.put("RAISON_SOCIALE", "");
        map.put("SOCIETE", "");
        map.put("FORME_JURIDIQUE", "");
        map.put("RC", "");
        map.put("NUMERO_RC", "");
        map.put("IF", "");
        map.put("NUMERO_IF", "");
        map.put("REPRESENTANT_LEGAL", "");
        map.put("CIN_REPRESENTANT", "");

        if (client instanceof ClientPersonnePhysique pp) {
            map.put("NOM", nullSafe(pp.getNom()));
            map.put("PRENOM", nullSafe(pp.getPrenom()));
            map.put("CIN", nullSafe(pp.getCin()));
            map.put("NATIONALITE", nullSafe(pp.getNationalite()));
            map.put("DATE_NAISSANCE",
                    pp.getDateNaissance() != null ? pp.getDateNaissance().toLocalDate().format(FR_DATE) : "");
        } else if (client instanceof ClientMoral cm) {
            map.put("NOM_COMMERCIAL", nullSafe(cm.getNomCommercial()));
            map.put("RAISON_SOCIALE", nullSafe(cm.getNomCommercial()));
            map.put("SOCIETE", nullSafe(cm.getNomCommercial()));
            map.put("FORME_JURIDIQUE", nullSafe(cm.getFormeJuridique()));
            map.put("RC", nullSafe(cm.getNumeroRegistreCommerce()));
            map.put("NUMERO_RC", nullSafe(cm.getNumeroRegistreCommerce()));
            map.put("IF", nullSafe(cm.getNumeroIdFiscal()));
            map.put("NUMERO_IF", nullSafe(cm.getNumeroIdFiscal()));
            String rep = (nullSafe(cm.getPrenomRepresentantLegal()) + " " + nullSafe(cm.getNomRepresentantLegal()))
                    .trim();
            map.put("REPRESENTANT_LEGAL", rep);
            map.put("CIN_REPRESENTANT", nullSafe(cm.getCinRepresentantLegal()));
        }

        // Bloc d'identité juridique rédigé proprement selon le type de client (Personne
        // Physique vs Société)
        map.put("CLIENT_IDENTITE_COMPLETE", client != null ? buildFormattedClientIdentity(client) : "");

        map.put("CABINET_NOM", "");
        map.put("CABINET_ADRESSE", "");
        map.put("CABINET_VILLE", "");
        map.put("CABINET_TELEPHONE", "");
        map.put("CABINET_EMAIL", "");
        map.put("CABINET_SIRET", "");
        map.put("CABINET_TVA", "");
        map.put("CABINET_IDENTITE_COMPLETE", buildFormattedCabinetIdentity(cabinet));

        if (cabinet != null) {
            map.put("CABINET_NOM", nullSafe(cabinet.getName()));
            map.put("CABINET_ADRESSE", nullSafe(cabinet.getAddress()));
            map.put("CABINET_VILLE", nullSafe(cabinet.getCity()));
            map.put("CABINET_TELEPHONE", nullSafe(cabinet.getPhone()));
            map.put("CABINET_EMAIL", nullSafe(cabinet.getEmail()));
            map.put("CABINET_SIRET", nullSafe(cabinet.getSiret()));
            map.put("CABINET_TVA", nullSafe(cabinet.getVatNumber()));
        }
        return map;
    }

    private String buildFormattedClientIdentity(ClientEntity client) {
        List<String> parts = new ArrayList<>();
        String name = firstNonBlank(client.getDisplayName(), "Client #" + client.getId());
        parts.add(name);

        if (client instanceof ClientPersonnePhysique pp) {
            if (pp.getNationalite() != null && !pp.getNationalite().isBlank()) {
                parts.add("de nationalité " + pp.getNationalite().trim());
            }
            if (pp.getCin() != null && !pp.getCin().isBlank()) {
                parts.add("titulaire de la pièce d'identité n° " + pp.getCin().trim());
            }
            String addr = joinNonBlank(", ", client.getAdresse(), client.getPays());
            if (!addr.isBlank())
                parts.add("domicilié(e) à " + addr);
        } else if (client instanceof ClientMoral cm) {
            if (cm.getFormeJuridique() != null && !cm.getFormeJuridique().isBlank()) {
                parts.add("société de forme " + cm.getFormeJuridique().trim());
            }
            if (cm.getNumeroRegistreCommerce() != null && !cm.getNumeroRegistreCommerce().isBlank()) {
                parts.add("immatriculée au RC sous le n° " + cm.getNumeroRegistreCommerce().trim());
            }
            if (cm.getNumeroIdFiscal() != null && !cm.getNumeroIdFiscal().isBlank()) {
                parts.add("IF n° " + cm.getNumeroIdFiscal().trim());
            }
            String addr = joinNonBlank(", ", client.getAdresse(), client.getPays());
            if (!addr.isBlank())
                parts.add("ayant son siège social sis " + addr);
            String rep = joinNonBlank(" ", cm.getPrenomRepresentantLegal(), cm.getNomRepresentantLegal());
            if (!rep.isBlank())
                parts.add("représentée par " + rep);
        } else {
            String addr = joinNonBlank(", ", client.getAdresse(), client.getPays());
            if (!addr.isBlank())
                parts.add("domicilié(e) à " + addr);
        }

        String contact = joinNonBlank(" / ", client.getTelephone(), client.getEmail());
        if (!contact.isBlank())
            parts.add("joignable au " + contact);
        return String.join(", ", parts);
    }

    private String buildFormattedCabinetIdentity(CabinetProfile cabinet) {
        if (cabinet == null)
            return "Le Cabinet";
        List<String> parts = new ArrayList<>();
        parts.add("Le Cabinet " + firstNonBlank(cabinet.getName(), "d'Avocats"));
        String addr = joinNonBlank(" ", cabinet.getAddress(), cabinet.getCity());
        if (!addr.isBlank())
            parts.add("sis à " + addr);
        String contact = joinNonBlank(" / ", cabinet.getPhone(), cabinet.getEmail());
        if (!contact.isBlank())
            parts.add("joignable au " + contact);
        return String.join(", ", parts);
    }

    private static String joinNonBlank(String sep, String... items) {
        List<String> list = new ArrayList<>();
        for (String it : items) {
            if (it != null && !it.isBlank())
                list.add(it.trim());
        }
        return String.join(sep, list);
    }

    private String buildClientContextSummary(ClientEntity client, Dossier dossier, CabinetProfile cabinet) {
        StringBuilder sb = new StringBuilder();
        sb.append("Date du jour : ").append(LocalDate.now().format(FR_DATE)).append("\n");
        if (dossier != null) {
            sb.append("DOSSIER (#").append(dossier.getId()).append(")\n");
            sb.append("- Référence interne : ").append(firstNonBlank(dossier.getReferenceInterne(), "-")).append("\n");
            sb.append("- Titre : ").append(firstNonBlank(dossier.getTitre(), "-")).append("\n");
            if (dossier.getDescription() != null && !dossier.getDescription().isBlank()) {
                sb.append("- Description : ").append(truncate(dossier.getDescription(), 400)).append("\n");
            }
            if (dossier.getDomaineJuridique() != null && !dossier.getDomaineJuridique().isBlank()) {
                sb.append("- Domaine juridique : ").append(dossier.getDomaineJuridique()).append("\n");
            }
            if (dossier.getPaysJuridiction() != null && !dossier.getPaysJuridiction().isBlank()) {
                sb.append("- Juridiction / Pays : ").append(dossier.getPaysJuridiction()).append("\n");
            }
            if (dossier.getAutresParties() != null && !dossier.getAutresParties().isEmpty()) {
                String parties = dossier.getAutresParties().stream()
                        .map(p -> {
                            String nom = p.getPartie() != null ? nullSafe(p.getPartie().getDisplayName()) : "";
                            return nom.isBlank() ? "" : (p.getRole() != null ? nom + " (" + p.getRole() + ")" : nom);
                        })
                        .filter(s -> !s.isBlank())
                        .reduce((a, b) -> a + ", " + b).orElse("");
                if (!parties.isBlank()) {
                    sb.append("- Autres parties / Parties adverses : ").append(parties).append("\n");
                }
            }
            sb.append("\n");
        }
        if (client != null) {
            sb.append("CLIENT (#").append(client.getId()).append(" — ").append(nullSafe(client.getType()))
                    .append(")\n");
            sb.append("- Nom / Raison sociale : ").append(firstNonBlank(client.getDisplayName(), "-")).append("\n");
            sb.append("- Email : ").append(firstNonBlank(client.getEmail(), "-")).append("\n");
            sb.append("- Téléphone : ").append(firstNonBlank(client.getTelephone(), "-")).append("\n");
            sb.append("- Adresse : ").append(firstNonBlank(client.getAdresse(), "-")).append("\n");
            sb.append("- Pays : ").append(firstNonBlank(client.getPays(), "-")).append("\n");

            if (client instanceof ClientPersonnePhysique pp) {
                sb.append("- Nom : ").append(nullSafe(pp.getNom())).append(" | Prénom : ")
                        .append(nullSafe(pp.getPrenom())).append("\n");
                sb.append("- CIN : ").append(nullSafe(pp.getCin())).append(" | Nationalité : ")
                        .append(nullSafe(pp.getNationalite())).append("\n");
            } else if (client instanceof ClientMoral cm) {
                sb.append("- Forme juridique : ").append(nullSafe(cm.getFormeJuridique())).append("\n");
                sb.append("- RC : ").append(nullSafe(cm.getNumeroRegistreCommerce())).append(" | IF : ")
                        .append(nullSafe(cm.getNumeroIdFiscal())).append("\n");
                sb.append("- Représentant légal : ").append(nullSafe(cm.getPrenomRepresentantLegal())).append(" ")
                        .append(nullSafe(cm.getNomRepresentantLegal())).append(" (CIN: ")
                        .append(nullSafe(cm.getCinRepresentantLegal())).append(")\n");
            }
        }

        if (cabinet != null) {
            sb.append("\nCABINET D'AVOCATS\n");
            sb.append("- Nom : ").append(nullSafe(cabinet.getName())).append("\n");
            sb.append("- Adresse : ").append(nullSafe(cabinet.getAddress())).append(" ")
                    .append(nullSafe(cabinet.getCity())).append("\n");
            sb.append("- Téléphone : ").append(nullSafe(cabinet.getPhone())).append(" | Email : ")
                    .append(nullSafe(cabinet.getEmail())).append("\n");
            sb.append("- SIRET/ICE : ").append(nullSafe(cabinet.getSiret())).append("\n");
        }
        return sb.toString();
    }

    private ModelCandidate toCandidate(Document d, String reason, boolean recommended) {
        String title = firstNonBlank(d.getTitle(), d.getName(),
                stripExtension(firstNonBlank(d.getNomFichier(), d.getFilename(), "Modèle #" + d.getId())));
        return new ModelCandidate(
                d.getId(),
                title,
                firstNonBlank(d.getNomFichier(), d.getFilename(), title),
                nullSafe(d.getDescription()),
                nullSafe(d.getTags()),
                reason,
                recommended);
    }

    private Set<String> expandTokens(String prompt) {
        Set<String> stop = Set.of("le", "la", "les", "un", "une", "des", "de", "du", "avec", "pour", "moi", "ce",
                "cette", "mon", "ma", "mes", "genere", "generer", "creer", "cree", "document", "modele", "client");
        Set<String> tokens = new LinkedHashSet<>();
        for (String w : normalize(prompt).split("\\s+")) {
            if (w.length() < 3 || stop.contains(w))
                continue;
            tokens.add(w);
            String singular = w.endsWith("s") && w.length() > 4 ? w.substring(0, w.length() - 1) : w;
            tokens.add(singular);
            for (Map.Entry<String, List<String>> e : LEGAL_SYNONYMS.entrySet()) {
                if (singular.contains(e.getKey()) || e.getKey().contains(singular)) {
                    tokens.addAll(e.getValue());
                }
            }
        }
        return tokens;
    }

    private static String extractJsonObject(String raw) {
        String s = raw.trim();
        int first = s.indexOf('{');
        int last = s.lastIndexOf('}');
        return (first >= 0 && last > first) ? s.substring(first, last + 1) : s;
    }

    private static String normalize(String raw) {
        if (raw == null)
            return "";
        return Normalizer.normalize(raw, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static String stripExtension(String name) {
        if (name == null)
            return "document";
        int idx = name.lastIndexOf('.');
        return idx > 0 ? name.substring(0, idx) : name;
    }

    private static String sanitizeFileName(String raw) {
        if (raw == null || raw.isBlank())
            return "Document";
        String n = Normalizer.normalize(raw, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        String clean = n.replaceAll("[^a-zA-Z0-9._-]+", "_").replaceAll("_+", "_").replaceAll("^_|_$", "");
        return clean.isBlank() ? "Document" : (clean.length() > 60 ? clean.substring(0, 60) : clean);
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank())
                return v.trim();
        }
        return "";
    }

    private static String truncate(String s, int max) {
        if (s == null)
            return "";
        String c = s.replaceAll("\\s+", " ").trim();
        return c.length() <= max ? c : c.substring(0, max - 1) + "…";
    }

    private static String nullSafe(String s) {
        return s == null ? "" : s;
    }

    private static <T> List<T> safeList(List<T> list) {
        return list == null ? List.of() : list;
    }
}
