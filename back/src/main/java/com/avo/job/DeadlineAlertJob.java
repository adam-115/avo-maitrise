package com.avo.job;

import com.avo.entities.AppUser;
import com.avo.entities.DeadlineAlertLog;
import com.avo.entities.Dossier;
import com.avo.entities.DossierDeadline;
import com.avo.entities.Notification;
import com.avo.repositories.DeadlineAlertLogRepository;
import com.avo.repositories.DossierDeadlineRepository;
import com.avo.repositories.DossierRepository;
import com.avo.repositories.NotificationRepository;
import com.avo.repositories.UserRepository;
import com.avo.services.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * Job quotidien de prévention des sinistres RCP (responsabilité civile professionnelle) :
 * vérifie tous les délais de procédure actifs et envoie des alertes graduées aux paliers
 * J-30, J-15, J-7 (in-app + email), J-3 (escalade suppléant/associé), J-1 et Jour J.
 */
@Component
@Slf4j
public class DeadlineAlertJob {

    private static final DateTimeFormatter FR_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final DossierDeadlineRepository deadlineRepository;
    private final DeadlineAlertLogRepository alertLogRepository;
    private final DossierRepository dossierRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    public DeadlineAlertJob(DossierDeadlineRepository deadlineRepository,
                            DeadlineAlertLogRepository alertLogRepository,
                            DossierRepository dossierRepository,
                            UserRepository userRepository,
                            NotificationRepository notificationRepository,
                            EmailService emailService) {
        this.deadlineRepository = deadlineRepository;
        this.alertLogRepository = alertLogRepository;
        this.dossierRepository = dossierRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.emailService = emailService;
    }

    /** Exécuté tous les jours à 07h00. */
    @Scheduled(cron = "${deadlines.alert.cron:0 0 7 * * *}")
    public void checkProceduralDeadlines() {
        List<DossierDeadline> active = deadlineRepository.findByStatutOrderByDateEcheanceFinaleAsc("ACTIF");
        LocalDate today = LocalDate.now();
        int sentCount = 0;

        for (DossierDeadline deadline : active) {
            long daysLeft = ChronoUnit.DAYS.between(today, deadline.getDateEcheanceFinale());
            String stage = resolveAlertStage(daysLeft);
            if (stage == null || alertLogRepository.existsByDeadlineIdAndAlertStage(deadline.getId(), stage)) {
                continue;
            }

            Dossier dossier = dossierRepository.findById(deadline.getDossierId()).orElse(null);
            String ref = dossier != null ? dossier.getReferenceInterne() : ("#" + deadline.getDossierId());
            String titreDossier = dossier != null ? dossier.getTitre() : "";
            Long clientId = (dossier != null && dossier.getClient() != null) ? dossier.getClient().getId() : null;

            String title = "[DÉLAI " + stage + "] " + deadline.getTitre() + " (" + ref + ")";
            String message = "Échéance le " + deadline.getDateEcheanceFinale().format(FR_DATE)
                    + " (" + deadline.getCategorie() + " - " + deadline.getPays() + ")"
                    + " · Dossier : " + titreDossier
                    + (deadline.getBaseLegale() != null ? " · " + deadline.getBaseLegale() : "");

            // 1. Notification in-app systématique (visible dans le centre d'alertes du Dashboard)
            notificationRepository.save(new Notification(title, message, clientId));

            // 2. Email à partir de J-7, avec escalade obligatoire au suppléant/associé à partir de J-3
            List<String> recipients = new ArrayList<>();
            boolean sendEmail = daysLeft <= 7;
            boolean escalate = daysLeft <= 3;

            if (sendEmail) {
                resolveUserEmail(deadline.getResponsableId()).ifPresent(recipients::add);
                if (escalate) {
                    resolveUserEmail(deadline.getSuppleantId()).ifPresent(email -> {
                        if (!recipients.contains(email)) recipients.add(email);
                    });
                }
                for (String to : recipients) {
                    try {
                        emailService.sendSimpleEmail(to, title,
                                message + "\n\nDétail du calcul :\n" + deadline.getDetailCalcul()
                                        + "\n\nMerci de marquer ce délai comme ACCOMPLI dans Avo-Maîtrise dès l'acte déposé.");
                    } catch (Exception e) {
                        log.warn("Échec d'envoi d'alerte email délai #{} vers {} : {}", deadline.getId(), to, e.getMessage());
                    }
                }
            }

            String channel = recipients.isEmpty() ? "IN_APP" : "IN_APP+EMAIL";
            alertLogRepository.save(new DeadlineAlertLog(deadline.getId(), stage, String.join(",", recipients), channel));
            sentCount++;
        }

        if (sentCount > 0) {
            log.info("[RCP] DeadlineAlertJob : {} alerte(s) de délai de procédure générée(s).", sentCount);
        }
    }

    private String resolveAlertStage(long daysLeft) {
        if (daysLeft < 0) return "EXPIRE";
        if (daysLeft == 0) return "J0";
        if (daysLeft == 1) return "J-1";
        if (daysLeft <= 3) return "J-3";
        if (daysLeft <= 7) return "J-7";
        if (daysLeft <= 15) return "J-15";
        if (daysLeft <= 30) return "J-30";
        return null;
    }

    private java.util.Optional<String> resolveUserEmail(String userIdStr) {
        if (userIdStr == null || userIdStr.isBlank()) return java.util.Optional.empty();
        try {
            Long id = Long.valueOf(userIdStr.trim());
            return userRepository.findById(id)
                    .map(AppUser::getEmail)
                    .filter(e -> e != null && !e.isBlank());
        } catch (NumberFormatException e) {
            return userRepository.findByUsername(userIdStr.trim())
                    .map(AppUser::getEmail)
                    .filter(em -> em != null && !em.isBlank());
        }
    }
}
