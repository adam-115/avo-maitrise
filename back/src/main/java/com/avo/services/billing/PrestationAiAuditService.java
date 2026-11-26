package com.avo.services.billing;

import com.avo.dtos.InvoiceDossierServiceDTO;
import com.avo.entities.*;
import com.avo.mappers.InvoiceDossierServiceMapper;
import com.avo.repositories.*;
import com.avo.service.AiConfigurationService;
import com.avo.services.CurrentUserInfoService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.text.SimpleDateFormat;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Audit IA des prestations d'un dossier :
 * Croise les prestations déjà enregistrées (facturées ou non) avec les notes, tâches,
 * rendez-vous/audiences, événements de procédure et — UNIQUEMENT si le module Messagerie
 * est activé dans MailIntegrationConfig — les emails classés dans le dossier.
 * Propose les diligences oubliées à l'avocat, qui peut accepter ou refuser chaque ligne.
 */
@Service
@Slf4j
public class PrestationAiAuditService {

    private static final DateTimeFormatter ISO_DATE = DateTimeFormatter.ISO_LOCAL_DATE;

    public record PrestationProposal(
            String sourceKey,
            String sourceType,        // EMAIL | NOTE | TASK | APPOINTMENT | EVENT
            String sourceLabel,
            String serviceDate,       // YYYY-MM-DD
            String info,
            Long invoiceTypeOfServiceId,
            String invoiceTypeOfServiceLabel,
            int nbrOfMinutes,
            BigDecimal estimatedAmountHT,
            String confidence,        // HIGH | MEDIUM
            String reason
    ) {}

    public record AuditResult(
            Long dossierId,
            boolean aiUsed,
            boolean emailsIncluded,
            String summary,
            List<String> analyzedSources,
            int existingPrestationsCount,
            int ignoredDecisionsCount,
            List<PrestationProposal> proposals
    ) {}

    public record AcceptProposalRequest(
            String sourceKey,
            String serviceDate,
            String info,
            Long invoiceTypeOfServiceId,
            Integer nbrOfMinutes,
            Long doneById,
            InvoiceDossierServiceStatusEnum status
    ) {}

    public record RejectProposalRequest(
            String sourceKey,
            String suggestedInfo
    ) {}

    private final DossierRepository dossierRepository;
    private final InvoiceDossierServiceRepository prestationRepository;
    private final InvoiceTypeOfServiceRepository typeOfServiceRepository;
    private final NoteRepository noteRepository;
    private final TaskRepository taskRepository;
    private final AppointementRepository appointementRepository;
    private final MatterEventRepository matterEventRepository;
    private final DossierEmailRepository dossierEmailRepository;
    private final MailIntegrationConfigRepository mailIntegrationConfigRepository;
    private final PrestationAiDecisionRepository decisionRepository;
    private final UserRepository userRepository;
    private final CurrentUserInfoService currentUserInfoService;
    private final InvoiceDossierServiceMapper prestationMapper;
    private final AiConfigurationService aiConfigurationService;
    private final ObjectMapper objectMapper;

    public PrestationAiAuditService(
            DossierRepository dossierRepository,
            InvoiceDossierServiceRepository prestationRepository,
            InvoiceTypeOfServiceRepository typeOfServiceRepository,
            NoteRepository noteRepository,
            TaskRepository taskRepository,
            AppointementRepository appointementRepository,
            MatterEventRepository matterEventRepository,
            DossierEmailRepository dossierEmailRepository,
            MailIntegrationConfigRepository mailIntegrationConfigRepository,
            PrestationAiDecisionRepository decisionRepository,
            UserRepository userRepository,
            CurrentUserInfoService currentUserInfoService,
            InvoiceDossierServiceMapper prestationMapper,
            AiConfigurationService aiConfigurationService,
            ObjectMapper objectMapper) {
        this.dossierRepository = dossierRepository;
        this.prestationRepository = prestationRepository;
        this.typeOfServiceRepository = typeOfServiceRepository;
        this.noteRepository = noteRepository;
        this.taskRepository = taskRepository;
        this.appointementRepository = appointementRepository;
        this.matterEventRepository = matterEventRepository;
        this.dossierEmailRepository = dossierEmailRepository;
        this.mailIntegrationConfigRepository = mailIntegrationConfigRepository;
        this.decisionRepository = decisionRepository;
        this.userRepository = userRepository;
        this.currentUserInfoService = currentUserInfoService;
        this.prestationMapper = prestationMapper;
        this.aiConfigurationService = aiConfigurationService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public AuditResult auditDossier(Long dossierId) {
        Dossier dossier = dossierRepository.findById(dossierId)
                .orElseThrow(() -> new IllegalArgumentException("Dossier introuvable : " + dossierId));

        // 1. Vérifier si le module optionnel Messagerie (emails) est activé
        boolean emailsEnabled = mailIntegrationConfigRepository.findById(1L)
                .map(MailIntegrationConfig::isEnabled)
                .orElse(false);

        // 2. Charger les prestations existantes (facturées ou non) et le barème du cabinet
        List<InvoiceDossierService> existingPrestations = safeList(prestationRepository.findByDossier_Id(dossierId));
        List<InvoiceTypeOfService> activeTypes = safeList(typeOfServiceRepository.findAll()).stream()
                .filter(InvoiceTypeOfService::isActif)
                .toList();
        if (activeTypes.isEmpty()) {
            activeTypes = safeList(typeOfServiceRepository.findAll());
        }
        Map<Long, InvoiceTypeOfService> typeById = activeTypes.stream()
                .collect(Collectors.toMap(InvoiceTypeOfService::getId, t -> t, (a, b) -> a, LinkedHashMap::new));
        InvoiceTypeOfService defaultType = activeTypes.isEmpty() ? null : activeTypes.get(0);

        // 3. Décisions déjà prises par l'avocat (ACCEPTED / REJECTED)
        List<PrestationAiDecision> priorDecisions = safeList(decisionRepository.findByDossierId(dossierId));
        Set<String> decidedKeys = priorDecisions.stream()
                .map(PrestationAiDecision::getSourceKey)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        int rejectedCount = (int) priorDecisions.stream()
                .filter(d -> "REJECTED".equalsIgnoreCase(d.getDecision()))
                .count();

        // 4. Charger les activités du dossier
        List<Note> notes = safeList(noteRepository.findByDossier_Id(dossierId));
        List<Task> tasks = safeList(taskRepository.findByDossierId(dossierId));
        List<Appointement> appointments = safeList(appointementRepository.findByDossier_Id(dossierId));
        List<MatterEvent> events = safeList(matterEventRepository.findByDossierId(dossierId));
        List<DossierEmail> emails = emailsEnabled
                ? safeList(dossierEmailRepository.findByDossierIdOrderBySentAtDescFiledAtDesc(dossierId))
                : List.of();

        List<String> analyzedSources = new ArrayList<>();
        analyzedSources.add("Notes (" + notes.size() + ")");
        analyzedSources.add("Tâches (" + tasks.size() + ")");
        analyzedSources.add("Rendez-vous (" + appointments.size() + ")");
        analyzedSources.add("Événements (" + events.size() + ")");
        if (emailsEnabled) {
            analyzedSources.add("Emails (" + emails.size() + ")");
        }

        // Filtrer les sources non encore traitées
        List<Note> pendingNotes = notes.stream()
                .filter(n -> n.getId() != null && !decidedKeys.contains("NOTE:" + n.getId()))
                .limit(25).toList();
        List<Task> pendingTasks = tasks.stream()
                .filter(t -> t.getId() != null && !decidedKeys.contains("TASK:" + t.getId()))
                .limit(25).toList();
        List<Appointement> pendingAppointments = appointments.stream()
                .filter(a -> a.getId() != null && !decidedKeys.contains("APPOINTMENT:" + a.getId()))
                .limit(25).toList();
        List<MatterEvent> pendingEvents = events.stream()
                .filter(e -> e.getId() != null && !decidedKeys.contains("EVENT:" + e.getId()))
                .limit(25).toList();
        List<DossierEmail> pendingEmails = emailsEnabled
                ? emails.stream()
                    .filter(e -> e.getId() != null && !decidedKeys.contains("EMAIL:" + e.getId()))
                    .limit(25).toList()
                : List.of();

        int totalPendingSources = pendingNotes.size() + pendingTasks.size()
                + pendingAppointments.size() + pendingEvents.size() + pendingEmails.size();

        if (totalPendingSources == 0) {
            return new AuditResult(
                    dossierId,
                    false,
                    emailsEnabled,
                    "Aucune nouvelle activité non traitée à analyser sur ce dossier.",
                    analyzedSources,
                    existingPrestations.size(),
                    rejectedCount,
                    List.of()
            );
        }

        // 5. Analyse IA si activée, sinon fallback heuristique propre
        if (aiConfigurationService.isAiEnabled()) {
            try {
                AuditResult aiResult = runAiAudit(
                        dossier, emailsEnabled, existingPrestations, activeTypes, typeById, defaultType,
                        decidedKeys, rejectedCount, analyzedSources,
                        pendingNotes, pendingTasks, pendingAppointments, pendingEvents, pendingEmails
                );
                if (aiResult != null) {
                    return aiResult;
                }
            } catch (Exception e) {
                log.warn("Audit IA des prestations indisponible pour dossier {} ({}), bascule vers l'analyse heuristique.",
                        dossierId, e.getMessage());
            }
        }

        List<PrestationProposal> heuristic = buildHeuristicProposals(
                existingPrestations, activeTypes, defaultType,
                pendingNotes, pendingTasks, pendingAppointments, pendingEvents, pendingEmails
        );
        String summary = heuristic.isEmpty()
                ? "Toutes les activités analysées semblent déjà couvertes par les prestations existantes."
                : heuristic.size() + " prestation(s) potentiellement oubliée(s) détectée(s) (analyse automatique locale).";

        return new AuditResult(
                dossierId,
                false,
                emailsEnabled,
                summary,
                analyzedSources,
                existingPrestations.size(),
                rejectedCount,
                heuristic
        );
    }

    @Transactional
    public InvoiceDossierServiceDTO acceptProposal(Long dossierId, AcceptProposalRequest req) {
        if (req == null || req.info() == null || req.info().isBlank()) {
            throw new IllegalArgumentException("La description de la prestation est obligatoire.");
        }
        Dossier dossier = dossierRepository.findById(dossierId)
                .orElseThrow(() -> new IllegalArgumentException("Dossier introuvable : " + dossierId));

        InvoiceTypeOfService type = null;
        if (req.invoiceTypeOfServiceId() != null) {
            type = typeOfServiceRepository.findById(req.invoiceTypeOfServiceId()).orElse(null);
        }
        if (type == null) {
            type = typeOfServiceRepository.findAll().stream()
                    .filter(InvoiceTypeOfService::isActif)
                    .findFirst()
                    .orElseGet(() -> typeOfServiceRepository.findAll().stream().findFirst().orElse(null));
        }

        InvoiceDossierService entity = new InvoiceDossierService();
        entity.setDossier(dossier);
        entity.setInvoiceTypeOfService(type);
        entity.setInfo(req.info().trim());
        entity.setNbrOfMinutes(snapMinutes(req.nbrOfMinutes() != null ? req.nbrOfMinutes() : 15));
        entity.setServiceDate(parseLocalDateOrToday(req.serviceDate()));
        entity.setCreationDate(new Date());

        InvoiceDossierServiceStatusEnum targetStatus = req.status();
        if (targetStatus == null
                || targetStatus == InvoiceDossierServiceStatusEnum.FACTUREE
                || targetStatus == InvoiceDossierServiceStatusEnum.EN_COURS_DE_FACTURATION) {
            targetStatus = InvoiceDossierServiceStatusEnum.A_FACTURE;
        }
        entity.setStatus(targetStatus);

        AppUser currentUser = currentUserInfoService.getCurrentUser();
        entity.setCreatedBy(currentUser);
        if (req.doneById() != null) {
            entity.setDoneBy(userRepository.findById(req.doneById()).orElse(currentUser));
        } else {
            entity.setDoneBy(currentUser);
        }

        InvoiceDossierService saved = prestationRepository.save(entity);

        if (req.sourceKey() != null && !req.sourceKey().isBlank()) {
            saveDecision(dossierId, req.sourceKey().trim(), "ACCEPTED", truncate(req.info(), 490), saved.getId());
        }

        return prestationMapper.toDto(saved);
    }

    @Transactional
    public void rejectProposal(Long dossierId, RejectProposalRequest req) {
        if (req == null || req.sourceKey() == null || req.sourceKey().isBlank()) {
            throw new IllegalArgumentException("sourceKey obligatoire pour refuser une proposition.");
        }
        saveDecision(dossierId, req.sourceKey().trim(), "REJECTED", truncate(req.suggestedInfo(), 490), null);
    }

    @Transactional
    public void resetRejectedDecisions(Long dossierId) {
        decisionRepository.deleteByDossierIdAndDecision(dossierId, "REJECTED");
    }

    private void saveDecision(Long dossierId, String sourceKey, String decision, String info, Long prestationId) {
        PrestationAiDecision record = decisionRepository
                .findByDossierIdAndSourceKey(dossierId, sourceKey)
                .orElseGet(PrestationAiDecision::new);
        record.setDossierId(dossierId);
        record.setSourceKey(sourceKey);
        record.setDecision(decision);
        record.setSuggestedInfo(info);
        record.setCreatedPrestationId(prestationId);
        String username = currentUserInfoService.getCurrentUsername();
        record.setDecidedBy(username != null ? username : "avocat");
        record.setDecidedAt(java.time.LocalDateTime.now());
        decisionRepository.save(record);
    }

    private AuditResult runAiAudit(
            Dossier dossier,
            boolean emailsEnabled,
            List<InvoiceDossierService> existingPrestations,
            List<InvoiceTypeOfService> activeTypes,
            Map<Long, InvoiceTypeOfService> typeById,
            InvoiceTypeOfService defaultType,
            Set<String> decidedKeys,
            int rejectedCount,
            List<String> analyzedSources,
            List<Note> notes,
            List<Task> tasks,
            List<Appointement> appointments,
            List<MatterEvent> events,
            List<DossierEmail> emails) throws Exception {

        StringBuilder context = new StringBuilder();
        context.append("DOSSIER : #").append(dossier.getId())
                .append(" | Réf: ").append(nullSafe(dossier.getReferenceInterne()))
                .append(" | Titre: ").append(nullSafe(dossier.getTitre())).append("\n\n");

        context.append("=== CATALOGUE DES TYPES DE PRESTATIONS DU CABINET (invoiceTypeOfServiceId) ===\n");
        for (InvoiceTypeOfService t : activeTypes) {
            context.append("- ID=").append(t.getId())
                    .append(" | Code=").append(nullSafe(t.getCode()))
                    .append(" | Libellé=").append(nullSafe(t.getDescription()))
                    .append(" | Tarif/5min=").append(t.getPrice5min()).append("\n");
        }

        context.append("\n=== PRESTATIONS DÉJÀ ENREGISTRÉES (FACTURÉES OU NON — NE PAS DUPLIQUER) ===\n");
        if (existingPrestations.isEmpty()) {
            context.append("(Aucune prestation enregistrée pour l'instant)\n");
        } else {
            for (InvoiceDossierService p : existingPrestations) {
                context.append("- Date=").append(p.getServiceDate() != null ? p.getServiceDate() : formatDate(p.getCreationDate()))
                        .append(" | Statut=").append(p.getStatus())
                        .append(" | Type=").append(p.getInvoiceTypeOfService() != null ? p.getInvoiceTypeOfService().getDescription() : "-")
                        .append(" | Durée=").append(p.getNbrOfMinutes()).append("min")
                        .append(" | Info=").append(truncate(p.getInfo(), 180)).append("\n");
            }
        }

        context.append("\n=== ACTIVITÉS DU DOSSIER À VÉRIFIER ===\n");
        if (!appointments.isEmpty()) {
            context.append("\n[RENDEZ-VOUS / AUDIENCES]\n");
            for (Appointement a : appointments) {
                context.append("- [APPOINTMENT:").append(a.getId()).append("] Date=").append(formatDate(a.getDate()))
                        .append(" (").append(nullSafe(a.getTime())).append("-").append(nullSafe(a.getEndTime())).append(")")
                        .append(" | Titre=").append(truncate(a.getTitle(), 140))
                        .append(" | Lieu=").append(nullSafe(a.getLocation()))
                        .append(" | Statut=").append(nullSafe(a.getStatus())).append("\n");
            }
        }
        if (!events.isEmpty()) {
            context.append("\n[ÉVÉNEMENTS DE PROCÉDURE]\n");
            for (MatterEvent e : events) {
                context.append("- [EVENT:").append(e.getId()).append("] Date=").append(formatDate(e.getStartDate()))
                        .append(" | Titre=").append(truncate(e.getTitre(), 140))
                        .append(" | Desc=").append(truncate(e.getDescription(), 180))
                        .append(" | Lieu=").append(nullSafe(e.getLieu())).append("\n");
            }
        }
        if (!tasks.isEmpty()) {
            context.append("\n[TÂCHES]\n");
            for (Task t : tasks) {
                context.append("- [TASK:").append(t.getId()).append("] Date=").append(formatDate(t.getDateEcheance() != null ? t.getDateEcheance() : t.getCreatedAt()))
                        .append(" | Terminée=").append(t.isCompleted())
                        .append(" | TempsEstimé=").append(t.getEstimatedTimeMinutes() != null ? t.getEstimatedTimeMinutes() + "min" : "non renseigné")
                        .append(" | Titre=").append(truncate(t.getTitre(), 140))
                        .append(" | Desc=").append(truncate(t.getDescription(), 180)).append("\n");
            }
        }
        if (!notes.isEmpty()) {
            context.append("\n[NOTES & COMPTES-RENDUS]\n");
            for (Note n : notes) {
                context.append("- [NOTE:").append(n.getId()).append("] Date=").append(formatDate(n.getCreatedAt()))
                        .append(" | Titre=").append(truncate(n.getTitle(), 140))
                        .append(" | Contenu=").append(truncate(n.getDescription(), 220)).append("\n");
            }
        }
        if (emailsEnabled && !emails.isEmpty()) {
            context.append("\n[EMAILS CLASSÉS DANS LE DOSSIER]\n");
            for (DossierEmail em : emails) {
                String d = em.getSentAt() != null ? em.getSentAt().toLocalDate().toString()
                        : (em.getFiledAt() != null ? em.getFiledAt().toLocalDate().toString() : LocalDate.now().toString());
                context.append("- [EMAIL:").append(em.getId()).append("] Date=").append(d)
                        .append(" | Sens=").append(nullSafe(em.getDirection()))
                        .append(" | De=").append(nullSafe(em.getFromEmail()))
                        .append(" | Objet=").append(truncate(em.getSubject(), 140))
                        .append(" | Extrait=").append(truncate(em.getSnippet() != null ? em.getSnippet() : em.getBodyText(), 200)).append("\n");
            }
        }

        String prompt = """
                Tu es un auditeur de facturation pour un cabinet d'avocats.
                Date du jour : %s.
                Analyse les activités du dossier ci-dessous et identifie UNIQUEMENT les diligences facturables qui ne semblent PAS encore couvertes par une prestation déjà enregistrée (qu'elle soit facturée ou à facturer).

                Règles strictes :
                1. Ne crée JAMAIS de doublon avec une prestation déjà enregistrée.
                2. Regroupe si pertinent (ex: plusieurs emails courts sur un même sujet -> 1 seule prestation).
                3. Choisis l'ID exact dans le catalogue des types de prestations fourni (invoiceTypeOfServiceId).
                4. Estime une durée réaliste en minutes, obligatoirement multiple de 5 (ex: 15, 30, 45, 60, 90).
                5. Utilise comme sourceKey la balise exacte entre crochets (ex: "APPOINTMENT:12", "NOTE:5", "TASK:8", "EVENT:3", "EMAIL:19").
                6. Si aucune prestation oubliée n'est détectée, retourne une liste proposals vide [].

                Réponds UNIQUEMENT en JSON valide (sans bloc markdown ```json) avec cette structure exacte :
                {
                  "summary": "Synthèse en 1 phrase claire en français",
                  "proposals": [
                    {
                      "sourceKey": "NOTE:5",
                      "sourceType": "NOTE",
                      "sourceLabel": "Note du 12/11 : Compte-rendu audience",
                      "serviceDate": "YYYY-MM-DD",
                      "info": "Libellé professionnel prêt à facturer",
                      "invoiceTypeOfServiceId": 1,
                      "nbrOfMinutes": 30,
                      "confidence": "HIGH",
                      "reason": "Justification courte expliquant pourquoi cette diligence semble oubliée"
                    }
                  ]
                }

                %s
                """.formatted(LocalDate.now(), context);

        ChatClient client = ChatClient.create(aiConfigurationService.buildChatModel());
        String raw = client.prompt().user(prompt).call().content();
        if (raw == null || raw.isBlank()) {
            return null;
        }

        JsonNode root = objectMapper.readTree(extractJsonObject(raw));
        String summary = root.path("summary").asText("Audit IA terminé.");
        List<PrestationProposal> proposals = new ArrayList<>();
        Set<String> seenKeys = new HashSet<>();

        if (root.path("proposals").isArray()) {
            for (JsonNode p : root.path("proposals")) {
                String sourceKey = p.path("sourceKey").asText("").trim();
                if (sourceKey.isBlank() || decidedKeys.contains(sourceKey) || !seenKeys.add(sourceKey)) {
                    continue;
                }
                String sourceType = p.path("sourceType").asText(inferSourceType(sourceKey)).toUpperCase(Locale.ROOT);
                if (!emailsEnabled && "EMAIL".equals(sourceType)) {
                    continue;
                }
                String info = p.path("info").asText("").trim();
                if (info.isBlank()) continue;

                Long rawTypeId = p.hasNonNull("invoiceTypeOfServiceId") ? p.get("invoiceTypeOfServiceId").asLong() : null;
                InvoiceTypeOfService matchedType = (rawTypeId != null && typeById.containsKey(rawTypeId))
                        ? typeById.get(rawTypeId)
                        : defaultType;

                int minutes = snapMinutes(p.path("nbrOfMinutes").asInt(15));
                String serviceDate = parseLocalDateOrToday(p.path("serviceDate").asText(null)).format(ISO_DATE);
                String sourceLabel = p.path("sourceLabel").asText(sourceKey);
                String confidence = "MEDIUM".equalsIgnoreCase(p.path("confidence").asText("HIGH")) ? "MEDIUM" : "HIGH";
                String reason = p.path("reason").asText("Activité non retrouvée dans les prestations du dossier.");

                proposals.add(new PrestationProposal(
                        sourceKey,
                        sourceType,
                        sourceLabel,
                        serviceDate,
                        info,
                        matchedType != null ? matchedType.getId() : null,
                        matchedType != null ? matchedType.getDescription() : null,
                        minutes,
                        computeAmountHT(minutes, matchedType),
                        confidence,
                        reason
                ));
            }
        }

        return new AuditResult(
                dossier.getId(),
                true,
                emailsEnabled,
                summary,
                analyzedSources,
                existingPrestations.size(),
                rejectedCount,
                proposals
        );
    }

    private List<PrestationProposal> buildHeuristicProposals(
            List<InvoiceDossierService> existingPrestations,
            List<InvoiceTypeOfService> activeTypes,
            InvoiceTypeOfService defaultType,
            List<Note> notes,
            List<Task> tasks,
            List<Appointement> appointments,
            List<MatterEvent> events,
            List<DossierEmail> emails) {

        List<PrestationProposal> proposals = new ArrayList<>();
        String existingCorpus = existingPrestations.stream()
                .map(p -> normalize(nullSafe(p.getInfo()) + " " + (p.getServiceDate() != null ? p.getServiceDate() : "")))
                .collect(Collectors.joining(" || "));

        for (Appointement a : appointments) {
            String title = nullSafe(a.getTitle());
            if (isLikelyCovered(existingCorpus, title, formatDate(a.getDate()))) continue;
            int mins = computeAppointmentMinutes(a.getTime(), a.getEndTime());
            InvoiceTypeOfService type = pickBestType(activeTypes, defaultType, "audience", "rdv", "rendez", "reunion");
            proposals.add(new PrestationProposal(
                    "APPOINTMENT:" + a.getId(),
                    "APPOINTMENT",
                    "Rendez-vous du " + formatDate(a.getDate()) + " : " + truncate(title, 60),
                    formatDate(a.getDate()),
                    "Rendez-vous / Audience : " + title + (a.getLocation() != null && !a.getLocation().isBlank() ? " (" + a.getLocation() + ")" : ""),
                    type != null ? type.getId() : null,
                    type != null ? type.getDescription() : null,
                    mins,
                    computeAmountHT(mins, type),
                    "HIGH",
                    "Rendez-vous / audience présent dans l'agenda du dossier sans prestation correspondante."
            ));
        }

        for (MatterEvent e : events) {
            String title = nullSafe(e.getTitre());
            if (isLikelyCovered(existingCorpus, title, formatDate(e.getStartDate()))) continue;
            int mins = computeDateDiffMinutes(e.getStartDate(), e.getEndDate(), 45);
            InvoiceTypeOfService type = pickBestType(activeTypes, defaultType, "audience", "procedure", "diligence");
            proposals.add(new PrestationProposal(
                    "EVENT:" + e.getId(),
                    "EVENT",
                    "Événement du " + formatDate(e.getStartDate()) + " : " + truncate(title, 60),
                    formatDate(e.getStartDate()),
                    title + (e.getLieu() != null && !e.getLieu().isBlank() ? " — " + e.getLieu() : ""),
                    type != null ? type.getId() : null,
                    type != null ? type.getDescription() : null,
                    mins,
                    computeAmountHT(mins, type),
                    "HIGH",
                    "Événement de procédure non retrouvé dans les prestations du dossier."
            ));
        }

        for (Task t : tasks) {
            if (!t.isCompleted() && (t.getEstimatedTimeMinutes() == null || t.getEstimatedTimeMinutes() <= 0)) {
                continue;
            }
            String title = nullSafe(t.getTitre());
            String date = formatDate(t.getDateEcheance() != null ? t.getDateEcheance() : t.getCreatedAt());
            if (isLikelyCovered(existingCorpus, title, date)) continue;
            int mins = snapMinutes(t.getEstimatedTimeMinutes() != null && t.getEstimatedTimeMinutes() > 0 ? t.getEstimatedTimeMinutes() : 30);
            InvoiceTypeOfService type = pickBestType(activeTypes, defaultType, "redaction", "etude", "analyse", "tache");
            proposals.add(new PrestationProposal(
                    "TASK:" + t.getId(),
                    "TASK",
                    "Tâche : " + truncate(title, 60),
                    date,
                    "Diligence : " + title,
                    type != null ? type.getId() : null,
                    type != null ? type.getDescription() : null,
                    mins,
                    computeAmountHT(mins, type),
                    t.isCompleted() ? "HIGH" : "MEDIUM",
                    t.isCompleted() ? "Tâche marquée terminée mais absente des prestations." : "Tâche avec temps estimé (" + mins + " min) non encore reportée."
            ));
        }

        for (Note n : notes) {
            String title = nullSafe(n.getTitle());
            String date = formatDate(n.getCreatedAt());
            if (isLikelyCovered(existingCorpus, title, date)) continue;
            int mins = 15;
            InvoiceTypeOfService type = pickBestType(activeTypes, defaultType, "note", "consultation", "compte", "etude");
            proposals.add(new PrestationProposal(
                    "NOTE:" + n.getId(),
                    "NOTE",
                    "Note du " + date + " : " + truncate(title, 60),
                    date,
                    "Rédaction / Compte-rendu : " + title,
                    type != null ? type.getId() : null,
                    type != null ? type.getDescription() : null,
                    mins,
                    computeAmountHT(mins, type),
                    "MEDIUM",
                    "Note / compte-rendu rédigé sur le dossier sans prestation associée."
            ));
        }

        for (DossierEmail em : emails) {
            String subj = nullSafe(em.getSubject());
            String date = em.getSentAt() != null ? em.getSentAt().toLocalDate().toString()
                    : (em.getFiledAt() != null ? em.getFiledAt().toLocalDate().toString() : LocalDate.now().toString());
            if (isLikelyCovered(existingCorpus, subj, date)) continue;
            int mins = 15;
            InvoiceTypeOfService type = pickBestType(activeTypes, defaultType, "correspondance", "mail", "email", "courrier", "echange");
            proposals.add(new PrestationProposal(
                    "EMAIL:" + em.getId(),
                    "EMAIL",
                    "Email du " + date + " : " + truncate(subj, 60),
                    date,
                    "Correspondance email : " + (subj.isBlank() ? "Échange dossier" : subj),
                    type != null ? type.getId() : null,
                    type != null ? type.getDescription() : null,
                    mins,
                    computeAmountHT(mins, type),
                    "MEDIUM",
                    "Échange email classé dans le dossier sans prestation de correspondance détectée."
            ));
        }

        return proposals.stream().limit(15).toList();
    }

    private static boolean isLikelyCovered(String existingCorpus, String title, String date) {
        if (existingCorpus.isBlank() || title.isBlank()) return false;
        String normTitle = normalize(title);
        if (normTitle.length() >= 6 && existingCorpus.contains(normTitle)) return true;
        int matched = 0;
        for (String w : normTitle.split("\\s+")) {
            if (w.length() >= 5 && existingCorpus.contains(w)) matched++;
        }
        return matched >= 2 && existingCorpus.contains(date);
    }

    private static InvoiceTypeOfService pickBestType(List<InvoiceTypeOfService> types, InvoiceTypeOfService fallback, String... keywords) {
        for (InvoiceTypeOfService t : types) {
            String label = normalize(nullSafe(t.getDescription()) + " " + nullSafe(t.getCode()));
            for (String kw : keywords) {
                if (label.contains(kw)) return t;
            }
        }
        return fallback;
    }

    private static int computeAppointmentMinutes(String start, String end) {
        try {
            if (start != null && end != null && !start.isBlank() && !end.isBlank()) {
                LocalTime s = LocalTime.parse(start.length() == 5 ? start : start.substring(0, 5));
                LocalTime e = LocalTime.parse(end.length() == 5 ? end : end.substring(0, 5));
                long diff = Duration.between(s, e).toMinutes();
                if (diff >= 5 && diff <= 480) return snapMinutes((int) diff);
            }
        } catch (Exception ignored) {}
        return 30;
    }

    private static int computeDateDiffMinutes(Date start, Date end, int fallback) {
        if (start != null && end != null) {
            long diff = (end.getTime() - start.getTime()) / 60000L;
            if (diff >= 5 && diff <= 480) return snapMinutes((int) diff);
        }
        return fallback;
    }

    private static int snapMinutes(int raw) {
        if (raw <= 5) return 5;
        return ((raw + 4) / 5) * 5;
    }

    private static BigDecimal computeAmountHT(int minutes, InvoiceTypeOfService type) {
        if (type == null || type.getPrice5min() == null) return BigDecimal.ZERO;
        BigDecimal units = BigDecimal.valueOf(minutes).divide(BigDecimal.valueOf(5), 2, RoundingMode.HALF_UP);
        return units.multiply(type.getPrice5min()).setScale(2, RoundingMode.HALF_UP);
    }

    private static LocalDate parseLocalDateOrToday(String raw) {
        if (raw == null || raw.isBlank()) return LocalDate.now();
        try {
            return LocalDate.parse(raw.substring(0, Math.min(10, raw.length())));
        } catch (Exception e) {
            return LocalDate.now();
        }
    }

    private static String formatDate(Date d) {
        if (d == null) return LocalDate.now().toString();
        if (d instanceof java.sql.Date sqlDate) {
            return sqlDate.toLocalDate().toString();
        }
        return d.toInstant().atZone(ZoneId.systemDefault()).toLocalDate().toString();
    }

    private static String inferSourceType(String sourceKey) {
        int idx = sourceKey.indexOf(':');
        return idx > 0 ? sourceKey.substring(0, idx) : "NOTE";
    }

    private static String extractJsonObject(String raw) {
        String s = raw.trim();
        int first = s.indexOf('{');
        int last = s.lastIndexOf('}');
        if (first >= 0 && last > first) return s.substring(first, last + 1);
        return s;
    }

    private static String normalize(String raw) {
        if (raw == null) return "";
        String n = Normalizer.normalize(raw, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return n.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9\\s-]", " ").replaceAll("\\s+", " ").trim();
    }

    private static String truncate(String s, int max) {
        if (s == null) return "";
        String clean = s.replaceAll("\\s+", " ").trim();
        return clean.length() <= max ? clean : clean.substring(0, max - 1) + "…";
    }

    private static String nullSafe(String s) {
        return s == null ? "" : s;
    }

    private static <T> List<T> safeList(List<T> list) {
        return list == null ? List.of() : list;
    }
}
