package com.avo.services.deadline;

import com.avo.dtos.DossierDeadlineDTO;
import com.avo.entities.DeadlineRule;
import com.avo.entities.Dossier;
import com.avo.entities.DossierDeadline;
import com.avo.entities.EventType;
import com.avo.entities.MatterEvent;
import com.avo.events.MatterActionEvent;
import com.avo.repositories.DeadlineRuleRepository;
import com.avo.repositories.DossierDeadlineRepository;
import com.avo.repositories.DossierRepository;
import com.avo.repositories.EventTypeRepository;
import com.avo.repositories.MatterEventRepository;
import com.avo.service.ai.Pays;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service métier de gestion des délais de procédure d'un dossier :
 * prévisualisation déterministe, création avec synchronisation agenda (MatterEvent),
 * accomplissement (preuve RPVA), suspension, interruption / réinitialisation péremption,
 * et récupération des échéances critiques du cabinet.
 */
@Service
@Slf4j
public class DossierDeadlineService {

    private final DossierDeadlineRepository deadlineRepository;
    private final DeadlineRuleRepository ruleRepository;
    private final DossierRepository dossierRepository;
    private final MatterEventRepository matterEventRepository;
    private final EventTypeRepository eventTypeRepository;
    private final ProceduralDeadlineCalculator calculator;
    private final ApplicationEventPublisher eventPublisher;

    public DossierDeadlineService(DossierDeadlineRepository deadlineRepository,
                                  DeadlineRuleRepository ruleRepository,
                                  DossierRepository dossierRepository,
                                  MatterEventRepository matterEventRepository,
                                  EventTypeRepository eventTypeRepository,
                                  ProceduralDeadlineCalculator calculator,
                                  ApplicationEventPublisher eventPublisher) {
        this.deadlineRepository = deadlineRepository;
        this.ruleRepository = ruleRepository;
        this.dossierRepository = dossierRepository;
        this.matterEventRepository = matterEventRepository;
        this.eventTypeRepository = eventTypeRepository;
        this.calculator = calculator;
        this.eventPublisher = eventPublisher;
    }

    public List<DeadlineRule> getRules(String pays) {
        if (pays != null && !pays.isBlank()) {
            return ruleRepository.findByPaysIgnoreCaseAndActiveTrueOrderByCategorieAscLibelleAsc(Pays.normalize(pays));
        }
        return ruleRepository.findByActiveTrueOrderByPaysAscCategorieAscLibelleAsc();
    }

    @Transactional
    public DeadlineRule saveRule(DeadlineRule incoming) {
        DeadlineRule target = incoming.getId() != null
                ? ruleRepository.findById(incoming.getId()).orElse(new DeadlineRule())
                : new DeadlineRule();
        if (incoming.getCode() != null && !incoming.getCode().isBlank()) {
            target.setCode(incoming.getCode().trim().toUpperCase());
        } else if (target.getCode() == null || target.getCode().isBlank()) {
            target.setCode("RULE_" + System.currentTimeMillis());
        }
        target.setPays(Pays.normalize(incoming.getPays()));
        target.setDomaineCode(incoming.getDomaineCode() != null && !incoming.getDomaineCode().isBlank()
                ? incoming.getDomaineCode().trim().toUpperCase() : "ALL");
        target.setCategorie(incoming.getCategorie() != null && !incoming.getCategorie().isBlank()
                ? incoming.getCategorie().trim().toUpperCase() : "AUTRE");
        target.setLibelle(incoming.getLibelle());
        target.setDescription(incoming.getDescription());
        target.setDureeValeur(Math.max(incoming.getDureeValeur(), 1));
        target.setDureeUnite(incoming.getDureeUnite() != null ? incoming.getDureeUnite().toUpperCase() : "DAYS");
        target.setProrogeWeekendFerie(incoming.isProrogeWeekendFerie());
        target.setEstFranc(incoming.isEstFranc());
        target.setComputationMode(incoming.isProrogeWeekendFerie() ? "FR_CPC_640_642" : "PRESCRIPTION_STRICT");
        target.setCriticiteDefaut(incoming.getCriticiteDefaut() != null ? incoming.getCriticiteDefaut().toUpperCase() : "CRITIQUE");
        target.setBaseLegale(incoming.getBaseLegale());
        target.setSourceUrl(incoming.getSourceUrl());
        target.setActive(true);
        return ruleRepository.save(target);
    }

    @Transactional
    public void deleteRule(Long id) {
        ruleRepository.findById(id).ifPresent(rule -> {
            rule.setActive(false);
            ruleRepository.save(rule);
        });
    }

    public List<DossierDeadlineDTO> findByDossier(Long dossierId) {
        Dossier dossier = dossierRepository.findById(dossierId).orElse(null);
        return deadlineRepository.findByDossierIdOrderByDateEcheanceFinaleAsc(dossierId).stream()
                .map(d -> toDto(d, dossier))
                .toList();
    }

    /** Échéances actives à venir (dans les N prochains jours ou déjà échues), pour le widget Dashboard. */
    public List<DossierDeadlineDTO> findUpcomingCritical(int daysAhead) {
        LocalDate limit = LocalDate.now().plusDays(Math.max(daysAhead, 1));
        List<DossierDeadline> list = deadlineRepository
                .findByStatutAndDateEcheanceFinaleLessThanEqualOrderByDateEcheanceFinaleAsc("ACTIF", limit);
        Map<Long, Dossier> dossiersById = dossierRepository.findAllById(
                list.stream().map(DossierDeadline::getDossierId).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(Dossier::getId, d -> d));
        return list.stream()
                .map(d -> toDto(d, dossiersById.get(d.getDossierId())))
                .toList();
    }

    /** Prévisualisation déterministe sans sauvegarde en base. */
    public DossierDeadlineDTO preview(DossierDeadlineDTO req) {
        DeadlineRule rule = req.getRuleId() != null ? ruleRepository.findById(req.getRuleId()).orElse(null) : null;
        ProceduralDeadlineCalculator.CalculationResult calc = compute(req, rule);

        DossierDeadlineDTO out = new DossierDeadlineDTO();
        out.setDossierId(req.getDossierId());
        out.setRuleId(rule != null ? rule.getId() : null);
        out.setPays(resolvePays(req, rule));
        out.setTitre(req.getTitre() != null && !req.getTitre().isBlank()
                ? req.getTitre() : (rule != null ? rule.getLibelle() : "Délai de procédure"));
        out.setCategorie(req.getCategorie() != null && !req.getCategorie().isBlank()
                ? req.getCategorie() : (rule != null ? rule.getCategorie() : "AUTRE"));
        out.setTriggerEventLabel(req.getTriggerEventLabel());
        out.setDateDepart(calc.dateDepart());
        out.setDateEcheanceCalculee(calc.dateEcheance());
        out.setDateEcheanceFinale(req.getDateEcheanceFinale() != null ? req.getDateEcheanceFinale() : calc.dateEcheance());
        out.setDetailCalcul(calc.resumeCalcul());
        out.setEtapesCalcul(calc.etapes());
        out.setBaseLegale(rule != null ? rule.getBaseLegale() : req.getBaseLegale());
        out.setSourceUrl(rule != null ? rule.getSourceUrl() : req.getSourceUrl());
        out.setCriticite(req.getCriticite() != null ? req.getCriticite() : (rule != null ? rule.getCriticiteDefaut() : "CRITIQUE"));
        out.setDelaiDistanceMois(req.getDelaiDistanceMois());
        out.setAlsaceMoselle(req.isAlsaceMoselle());
        out.setSuspensionJours(req.getSuspensionJours());
        long remaining = ChronoUnit.DAYS.between(LocalDate.now(), out.getDateEcheanceFinale());
        out.setJoursRestants(remaining);
        out.setEnRetard(remaining < 0);
        return out;
    }

    @Transactional
    public DossierDeadlineDTO create(DossierDeadlineDTO req) {
        if (req.getDossierId() == null) {
            throw new IllegalArgumentException("L'identifiant du dossier est obligatoire.");
        }
        Dossier dossier = dossierRepository.findById(req.getDossierId())
                .orElseThrow(() -> new IllegalArgumentException("Dossier introuvable : " + req.getDossierId()));

        DeadlineRule rule = req.getRuleId() != null ? ruleRepository.findById(req.getRuleId()).orElse(null) : null;
        if (req.getPays() == null || req.getPays().isBlank()) {
            req.setPays(dossier.getPaysJuridiction() != null ? dossier.getPaysJuridiction() : Pays.PAR_DEFAUT);
        }

        ProceduralDeadlineCalculator.CalculationResult calc = compute(req, rule);
        String username = currentUsername();

        DossierDeadline entity = new DossierDeadline();
        entity.setDossierId(dossier.getId());
        entity.setRuleId(rule != null ? rule.getId() : null);
        entity.setPays(resolvePays(req, rule));
        entity.setTitre(req.getTitre() != null && !req.getTitre().isBlank()
                ? req.getTitre().trim() : (rule != null ? rule.getLibelle() : "Délai de procédure"));
        entity.setCategorie(req.getCategorie() != null && !req.getCategorie().isBlank()
                ? req.getCategorie() : (rule != null ? rule.getCategorie() : "AUTRE"));
        entity.setTriggerEventLabel(req.getTriggerEventLabel());
        entity.setDateDepart(calc.dateDepart());
        entity.setDateEcheanceCalculee(calc.dateEcheance());
        entity.setDateEcheanceFinale(req.getDateEcheanceFinale() != null ? req.getDateEcheanceFinale() : calc.dateEcheance());
        entity.setDetailCalcul(calc.resumeCalcul());
        entity.setBaseLegale(req.getBaseLegale() != null && !req.getBaseLegale().isBlank()
                ? req.getBaseLegale() : (rule != null ? rule.getBaseLegale() : null));
        entity.setSourceUrl(req.getSourceUrl() != null && !req.getSourceUrl().isBlank()
                ? req.getSourceUrl() : (rule != null ? rule.getSourceUrl() : null));
        entity.setDelaiDistanceMois(req.getDelaiDistanceMois());
        entity.setAlsaceMoselle(req.isAlsaceMoselle());
        entity.setSuspensionJours(req.getSuspensionJours());
        entity.setStatut("ACTIF");
        entity.setCriticite(req.getCriticite() != null ? req.getCriticite() : (rule != null ? rule.getCriticiteDefaut() : "CRITIQUE"));
        entity.setResponsableId(req.getResponsableId() != null ? req.getResponsableId() : dossier.getResponsableId());
        entity.setSuppleantId(req.getSuppleantId());
        entity.setMotifModification(req.getMotifModification());
        entity.setDocumentId(req.getDocumentId());
        entity.setValidePar(username);
        entity.setValideLe(LocalDateTime.now());

        // Synchronisation automatique avec l'agenda du dossier (MatterEvent)
        if (!Boolean.FALSE.equals(req.getSyncAgenda())) {
            MatterEvent event = syncMatterEvent(entity, null);
            entity.setMatterEventId(event.getId());
        }

        DossierDeadline saved = deadlineRepository.save(entity);
        publishActivity(dossier.getId(), "Création", saved.getId(),
                "Délai calculé et validé : " + saved.getTitre() + " (échéance le " + saved.getDateEcheanceFinale() + ")");
        return toDto(saved, dossier);
    }

    /** Marque un délai comme accompli (avec référence d'acte / RPVA). */
    @Transactional
    public DossierDeadlineDTO markCompleted(Long id, String justificatif) {
        DossierDeadline entity = deadlineRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Délai introuvable : " + id));
        entity.setStatut("ACCOMPLI");
        entity.setAccompliPar(currentUsername());
        entity.setAccompliLe(LocalDateTime.now());
        entity.setJustificatifAccomplissement(justificatif);

        if (entity.getMatterEventId() != null) {
            matterEventRepository.findById(entity.getMatterEventId()).ifPresent(ev -> {
                ev.setStatut("TERMINE");
                matterEventRepository.save(ev);
            });
        }
        DossierDeadline saved = deadlineRepository.save(entity);
        publishActivity(saved.getDossierId(), "Accomplissement", saved.getId(),
                "Délai accompli : " + saved.getTitre() + (justificatif != null && !justificatif.isBlank() ? " (" + justificatif + ")" : ""));
        return toDto(saved, dossierRepository.findById(saved.getDossierId()).orElse(null));
    }

    /** Interrompt un délai (ex. nouvelle diligence pour la péremption) et crée éventuellement un nouveau délai à partir de la date d'interruption. */
    @Transactional
    public DossierDeadlineDTO interrupt(Long id, LocalDate dateInterruption, String motif, boolean relancer) {
        DossierDeadline entity = deadlineRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Délai introuvable : " + id));
        LocalDate effDate = dateInterruption != null ? dateInterruption : LocalDate.now();
        entity.setStatut("INTERROMPU");
        entity.setMotifModification(motif != null ? motif : "Interrompu le " + effDate);
        if (entity.getMatterEventId() != null) {
            matterEventRepository.findById(entity.getMatterEventId()).ifPresent(ev -> {
                ev.setStatut("ANNULE");
                matterEventRepository.save(ev);
            });
        }
        deadlineRepository.save(entity);
        publishActivity(entity.getDossierId(), "Interruption", entity.getId(),
                "Délai interrompu : " + entity.getTitre() + " (" + entity.getMotifModification() + ")");

        if (relancer && entity.getRuleId() != null) {
            DossierDeadlineDTO next = new DossierDeadlineDTO();
            next.setDossierId(entity.getDossierId());
            next.setRuleId(entity.getRuleId());
            next.setPays(entity.getPays());
            next.setTitre(entity.getTitre());
            next.setCategorie(entity.getCategorie());
            next.setTriggerEventLabel("Suite à interruption / nouvelle diligence du " + effDate);
            next.setDateDepart(effDate);
            next.setDelaiDistanceMois(entity.getDelaiDistanceMois());
            next.setAlsaceMoselle(entity.isAlsaceMoselle());
            next.setResponsableId(entity.getResponsableId());
            next.setSuppleantId(entity.getSuppleantId());
            next.setSyncAgenda(true);
            return create(next);
        }
        return toDto(entity, dossierRepository.findById(entity.getDossierId()).orElse(null));
    }

    @Transactional
    public void delete(Long id) {
        deadlineRepository.findById(id).ifPresent(entity -> {
            if (entity.getMatterEventId() != null) {
                matterEventRepository.deleteById(entity.getMatterEventId());
            }
            publishActivity(entity.getDossierId(), "Suppression", entity.getId(),
                    "Délai supprimé : " + entity.getTitre());
            deadlineRepository.delete(entity);
        });
    }

    private ProceduralDeadlineCalculator.CalculationResult compute(DossierDeadlineDTO req, DeadlineRule rule) {
        if (rule != null) {
            return calculator.calculate(rule, req.getDateDepart(), req.getDelaiDistanceMois(),
                    req.isAlsaceMoselle(), req.getSuspensionJours());
        }
        int val = req.getCustomDureeValeur() != null ? req.getCustomDureeValeur() : 30;
        String unit = req.getCustomDureeUnite() != null ? req.getCustomDureeUnite() : "DAYS";
        boolean proroge = req.getCustomProrogeWeekendFerie() == null || req.getCustomProrogeWeekendFerie();
        boolean franc = Boolean.TRUE.equals(req.getCustomEstFranc());
        return calculator.calculate(new ProceduralDeadlineCalculator.CalculationInput(
                req.getDateDepart(), val, unit, resolvePays(req, null),
                proroge, franc, req.getDelaiDistanceMois(), req.isAlsaceMoselle(),
                req.getSuspensionJours(), req.getBaseLegale()
        ));
    }

    private String resolvePays(DossierDeadlineDTO req, DeadlineRule rule) {
        if (rule != null && rule.getPays() != null) return Pays.normalize(rule.getPays());
        return Pays.normalize(req.getPays());
    }

    private MatterEvent syncMatterEvent(DossierDeadline deadline, Long existingEventId) {
        MatterEvent event = existingEventId != null
                ? matterEventRepository.findById(existingEventId).orElse(new MatterEvent())
                : new MatterEvent();
        event.setDossierId(deadline.getDossierId());
        event.setTitre("[DÉLAI " + deadline.getCategorie() + "] " + deadline.getTitre());
        event.setDescription(deadline.getDetailCalcul());
        event.setAllDay(true);
        Date start = Date.from(deadline.getDateEcheanceFinale().atTime(9, 0).atZone(ZoneId.systemDefault()).toInstant());
        Date end = Date.from(deadline.getDateEcheanceFinale().atTime(18, 0).atZone(ZoneId.systemDefault()).toInstant());
        event.setStartDate(start);
        event.setEndDate(end);
        event.setStatut("CONFIRME");
        event.setReminderMinutesBefore(1440);
        EventType type = eventTypeRepository.findAll().stream()
                .filter(t -> "ECHEANCE_PROCEDURE".equalsIgnoreCase(t.getCode()))
                .findFirst().orElse(null);
        event.setCategorie(type);
        return matterEventRepository.save(event);
    }

    private void publishActivity(Long dossierId, String action, Long targetId, String description) {
        eventPublisher.publishEvent(new MatterActionEvent(
                this, dossierId, currentUsername(), action, "Délai de procédure", targetId, description));
    }

    private String currentUsername() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null) return auth.getName();
        } catch (Exception ignored) {}
        return "Système";
    }

    public DossierDeadlineDTO toDto(DossierDeadline d, Dossier dossier) {
        DossierDeadlineDTO dto = new DossierDeadlineDTO();
        dto.setId(d.getId());
        dto.setDossierId(d.getDossierId());
        if (dossier != null) {
            dto.setDossierReference(dossier.getReferenceInterne());
            dto.setDossierTitre(dossier.getTitre());
        }
        dto.setRuleId(d.getRuleId());
        dto.setPays(d.getPays());
        dto.setTitre(d.getTitre());
        dto.setCategorie(d.getCategorie());
        dto.setTriggerEventLabel(d.getTriggerEventLabel());
        dto.setDateDepart(d.getDateDepart());
        dto.setDateEcheanceCalculee(d.getDateEcheanceCalculee());
        dto.setDateEcheanceFinale(d.getDateEcheanceFinale());
        dto.setDetailCalcul(d.getDetailCalcul());
        dto.setBaseLegale(d.getBaseLegale());
        dto.setSourceUrl(d.getSourceUrl());
        dto.setDelaiDistanceMois(d.getDelaiDistanceMois());
        dto.setAlsaceMoselle(d.isAlsaceMoselle());
        dto.setSuspensionJours(d.getSuspensionJours());
        dto.setStatut(d.getStatut());
        dto.setCriticite(d.getCriticite());
        dto.setResponsableId(d.getResponsableId());
        dto.setSuppleantId(d.getSuppleantId());
        dto.setValidePar(d.getValidePar());
        dto.setValideLe(d.getValideLe());
        dto.setAccompliPar(d.getAccompliPar());
        dto.setAccompliLe(d.getAccompliLe());
        dto.setJustificatifAccomplissement(d.getJustificatifAccomplissement());
        dto.setMotifModification(d.getMotifModification());
        dto.setMatterEventId(d.getMatterEventId());
        dto.setDocumentId(d.getDocumentId());
        dto.setCreatedAt(d.getCreatedAt());
        dto.setUpdatedAt(d.getUpdatedAt());
        long remaining = ChronoUnit.DAYS.between(LocalDate.now(), d.getDateEcheanceFinale());
        dto.setJoursRestants(remaining);
        dto.setEnRetard("ACTIF".equals(d.getStatut()) && remaining < 0);
        return dto;
    }
}
