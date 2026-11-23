package com.avo.services.acts;

import com.avo.dtos.DocumentDTO;
import com.avo.entities.ActTemplate;
import com.avo.entities.CabinetProfile;
import com.avo.entities.DocumentType;
import com.avo.entities.Dossier;
import com.avo.repositories.ActTemplateRepository;
import com.avo.repositories.CabinetProfileRepository;
import com.avo.repositories.DossierRepository;
import com.avo.service.AiConfigurationService;
import com.avo.service.ai.AiDossierSummaryService;
import com.avo.service.ai.Pays;
import com.avo.services.DocumentService;
import com.avo.services.MinioService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.*;

/**
 * Service métier de gestion des modèles d'actes et de génération automatique
 * (aperçu, export Word .docx, classement direct dans la GED du dossier, et enrichissement IA).
 */
@Service
@Slf4j
public class ActGenerationService {

    private final ActTemplateRepository templateRepository;
    private final DossierRepository dossierRepository;
    private final CabinetProfileRepository cabinetProfileRepository;
    private final ActContextBuilder contextBuilder;
    private final ActTemplateEngine engine;
    private final MinioService minioService;
    private final DocumentService documentService;
    private final AiConfigurationService aiConfigurationService;
    private final AiDossierSummaryService dossierSummaryService;

    public ActGenerationService(ActTemplateRepository templateRepository,
                                DossierRepository dossierRepository,
                                CabinetProfileRepository cabinetProfileRepository,
                                ActContextBuilder contextBuilder,
                                ActTemplateEngine engine,
                                MinioService minioService,
                                DocumentService documentService,
                                AiConfigurationService aiConfigurationService,
                                AiDossierSummaryService dossierSummaryService) {
        this.templateRepository = templateRepository;
        this.dossierRepository = dossierRepository;
        this.cabinetProfileRepository = cabinetProfileRepository;
        this.contextBuilder = contextBuilder;
        this.engine = engine;
        this.minioService = minioService;
        this.documentService = documentService;
        this.aiConfigurationService = aiConfigurationService;
        this.dossierSummaryService = dossierSummaryService;
    }

    public List<ActTemplate> listTemplates(String pays, String categorie) {
        String normPays = (pays != null && !pays.isBlank()) ? Pays.normalize(pays) : null;
        return templateRepository.findByActiveTrueOrderByCategorieAscTitreAsc().stream()
                .filter(t -> normPays == null || "ALL".equalsIgnoreCase(t.getPays()) || normPays.equalsIgnoreCase(t.getPays()))
                .filter(t -> categorie == null || categorie.isBlank() || categorie.equalsIgnoreCase(t.getCategorie()))
                .toList();
    }

    @Transactional
    public ActTemplate saveTemplate(ActTemplate template, String docxBase64) {
        ActTemplate target;
        if (template.getId() != null) {
            target = templateRepository.findById(template.getId()).orElse(new ActTemplate());
        } else {
            target = new ActTemplate();
        }
        if (template.getCode() != null && !template.getCode().isBlank()) {
            target.setCode(template.getCode().trim());
        } else if (target.getCode() == null || target.getCode().isBlank()) {
            target.setCode("CUSTOM_" + System.currentTimeMillis());
        }
        target.setTitre(template.getTitre());
        target.setCategorie(template.getCategorie());
        target.setPays(template.getPays());
        target.setDescription(template.getDescription());
        target.setFormat(template.getFormat() != null ? template.getFormat() : "TEXT_TEMPLATE");
        target.setContent(template.getContent());
        target.setActive(true);

        if (docxBase64 != null && !docxBase64.isBlank()) {
            String clean = docxBase64.contains(",") ? docxBase64.split(",")[1] : docxBase64;
            byte[] bytes = Base64.getDecoder().decode(clean);
            String filename = template.getNomFichier() != null ? template.getNomFichier() : (target.getCode() + ".docx");
            try (InputStream is = new ByteArrayInputStream(bytes)) {
                String objId = minioService.uploadFile(filename, is, bytes.length,
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
                target.setMinioObjectId(objId);
                target.setNomFichier(filename);
                target.setFormat("DOCX_FILE");
            } catch (Exception e) {
                throw new RuntimeException("Erreur upload du modèle DOCX : " + e.getMessage(), e);
            }
        }
        return templateRepository.save(target);
    }

    @Transactional
    public void deleteTemplate(Long id) {
        templateRepository.findById(id).ifPresent(t -> {
            t.setActive(false);
            templateRepository.save(t);
        });
    }

    public Map<String, String> getVariablesForDossier(Long dossierId) {
        return contextBuilder.buildVariables(dossierId);
    }

    /** Prévisualisation : retourne le texte fusionné, toutes les variables du modèle, leurs valeurs et les manquantes. */
    public Map<String, Object> preview(Long templateId, Long dossierId, Map<String, String> customValues) {
        ActTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new IllegalArgumentException("Modèle d'acte introuvable : " + templateId));

        Map<String, String> mergedVars = new LinkedHashMap<>(contextBuilder.buildVariables(dossierId));
        if (customValues != null) {
            customValues.forEach((k, v) -> {
                if (v != null) mergedVars.put(k, v);
            });
        }

        List<String> placeholders;
        String previewText;
        if ("DOCX_FILE".equalsIgnoreCase(template.getFormat()) && template.getMinioObjectId() != null) {
            byte[] docxBytes = downloadFromMinio(template.getMinioObjectId());
            try {
                placeholders = engine.extractPlaceholdersFromDocx(docxBytes);
            } catch (IOException e) {
                throw new RuntimeException("Erreur lecture du modèle DOCX", e);
            }
            previewText = "Modèle Word (.docx) prêt à fusionner : " + template.getNomFichier()
                    + "\nVariables détectées : " + String.join(", ", placeholders);
        } else {
            placeholders = engine.extractPlaceholders(template.getContent());
            previewText = engine.renderText(template.getContent(), mergedVars);
        }

        List<String> missing = engine.findMissingVariables(placeholders, mergedVars);
        Map<String, String> templateVars = new LinkedHashMap<>();
        for (String key : placeholders) {
            templateVars.put(key, mergedVars.getOrDefault(key, ""));
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("templateId", template.getId());
        res.put("titre", template.getTitre());
        res.put("format", template.getFormat());
        res.put("placeholders", placeholders);
        res.put("variables", templateVars);
        res.put("missingVariables", missing);
        res.put("previewText", previewText);

        CabinetProfile cabinet = cabinetProfileRepository.findAll().stream().findFirst().orElse(null);
        if (cabinet != null) {
            Map<String, Object> cab = new LinkedHashMap<>();
            cab.put("name", cabinet.getName());
            cab.put("address", cabinet.getAddress());
            cab.put("postalCode", cabinet.getPostalCode());
            cab.put("city", cabinet.getCity());
            cab.put("phone", cabinet.getPhone());
            cab.put("email", cabinet.getEmail());
            cab.put("website", cabinet.getWebsite());
            cab.put("siret", cabinet.getSiret());
            cab.put("vatNumber", cabinet.getVatNumber());
            cab.put("iban", cabinet.getIban());
            if (cabinet.getLogo() != null && cabinet.getLogo().length > 0) {
                String mime = cabinet.getLogoContentType() != null ? cabinet.getLogoContentType() : "image/png";
                cab.put("logoDataUrl", "data:" + mime + ";base64," + Base64.getEncoder().encodeToString(cabinet.getLogo()));
            }
            res.put("cabinet", cab);
        }
        return res;
    }

    /**
     * Génère le fichier Word (.docx) final (soit depuis le texte édité par l'avocat, soit par fusion DOCX),
     * l'enregistre optionnellement dans les pièces du dossier (MinIO + Qdrant + journal) et retourne ses octets.
     */
    @Transactional
    public GeneratedActResult generateDocx(Long templateId, Long dossierId, String customTitle,
                                           String editedContent, Map<String, String> customValues,
                                           boolean saveToDossier) {
        ActTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new IllegalArgumentException("Modèle d'acte introuvable : " + templateId));
        Dossier dossier = dossierRepository.findById(dossierId)
                .orElseThrow(() -> new IllegalArgumentException("Dossier introuvable : " + dossierId));

        Map<String, String> mergedVars = new LinkedHashMap<>(contextBuilder.buildVariables(dossierId));
        if (customValues != null) {
            customValues.forEach((k, v) -> {
                if (v != null) mergedVars.put(k, v);
            });
        }

        CabinetProfile cabinet = cabinetProfileRepository.findAll().stream().findFirst().orElse(null);

        byte[] docxBytes;
        try {
            if ("DOCX_FILE".equalsIgnoreCase(template.getFormat()) && template.getMinioObjectId() != null) {
                docxBytes = engine.mergeDocxTemplate(downloadFromMinio(template.getMinioObjectId()), mergedVars);
            } else {
                String finalText = (editedContent != null && !editedContent.isBlank())
                        ? editedContent
                        : engine.renderText(template.getContent(), mergedVars);
                docxBytes = engine.buildDocxFromText(template.getTitre(), finalText, cabinet);
            }
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de la génération du fichier Word (.docx) : " + e.getMessage(), e);
        }

        String baseTitle = (customTitle != null && !customTitle.isBlank()) ? customTitle.trim() : template.getTitre();
        String safeSlug = baseTitle.replaceAll("[^a-zA-Z0-9\\-_]", "_").replaceAll("_+", "_");
        if (safeSlug.length() > 60) safeSlug = safeSlug.substring(0, 60);
        String filename = safeSlug + "_" + LocalDate.now() + ".docx";

        DocumentDTO savedDoc = null;
        if (saveToDossier) {
            DocumentDTO dto = new DocumentDTO();
            dto.setDossierId(dossier.getId());
            if (dossier.getClient() != null) {
                dto.setClientId(dossier.getClient().getId());
            }
            dto.setNomFichier(filename);
            dto.setFilename(filename);
            dto.setTitle(baseTitle);
            dto.setDescription("Acte généré automatiquement depuis le modèle « " + template.getTitre() + " »");
            dto.setTypeDocument(DocumentType.DOSSIER);
            dto.setTags(template.getCategorie());
            dto.setFileData(Base64.getEncoder().encodeToString(docxBytes));
            savedDoc = documentService.create(dto);
        }

        return new GeneratedActResult(filename, docxBytes, savedDoc != null ? savedDoc.getId() : null);
    }

    /**
     * Phase 3 : Enrichissement contrôlé par IA d'un brouillon d'acte.
     * L'IA s'appuie sur le résumé et la stratégie du dossier pour étoffer l'exposé des faits et
     * les moyens en droit, tout en conservant strictement les coordonnées, montants et dates déjà fusionnés.
     */
    public String enhanceWithAi(Long dossierId, String draftText, String instruction) {
        if (!aiConfigurationService.isAiEnabled()) {
            throw new IllegalStateException("L'Intelligence Artificielle est désactivée.");
        }
        Dossier dossier = dossierRepository.findById(dossierId)
                .orElseThrow(() -> new IllegalArgumentException("Dossier introuvable : " + dossierId));
        String summary = dossierSummaryService.generateDossierSummary(dossierId);
        String strategy = dossier.getAiStrategy() != null ? dossier.getAiStrategy() : "";

        String prompt = """
                Tu es un avocat rédacteur senior (%s).
                Améliore et complète le brouillon d'acte ci-dessous en t'appuyant UNIQUEMENT sur le contexte réel du dossier fourni.
                RÈGLES STRICTES :
                - Ne modifie JAMAIS les noms, adresses, références, dates ni montants déjà présents dans le brouillon.
                - N'invente aucun numéro d'arrêt ni article de loi absent du contexte du dossier.
                - Conserve la structure juridique formelle de l'acte et renvoie uniquement le texte complet prêt à relire.

                CONSIGNE DE L'AVOCAT :
                %s

                CONTEXTE DU DOSSIER :
                %s

                STRATÉGIE DU DOSSIER (si disponible) :
                %s

                BROUILLON À ENRICHIR :
                %s
                """.formatted(
                dossier.getPaysJuridiction() != null ? dossier.getPaysJuridiction() : "FRANCE",
                (instruction != null && !instruction.isBlank()) ? instruction : "Étoffer l'exposé des faits et la discussion juridique de manière rigoureuse.",
                summary,
                strategy.length() > 4000 ? strategy.substring(0, 4000) : strategy,
                draftText);

        return ChatClient.create(aiConfigurationService.buildChatModel())
                .prompt().user(prompt).call().content();
    }

    private byte[] downloadFromMinio(String objectId) {
        try (InputStream in = minioService.getFileStream(objectId)) {
            if (in == null) throw new IllegalStateException("Fichier modèle introuvable dans MinIO : " + objectId);
            return in.readAllBytes();
        } catch (IOException e) {
            throw new RuntimeException("Erreur lecture MinIO : " + e.getMessage(), e);
        }
    }

    public record GeneratedActResult(String filename, byte[] docxBytes, Long savedDocumentId) {}
}
