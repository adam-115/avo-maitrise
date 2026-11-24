package com.avo.services.mail;

import com.avo.entities.Appointement;
import com.avo.entities.Dossier;
import com.avo.entities.DossierDeadline;
import com.avo.entities.MailAccount;
import com.avo.entities.MatterEvent;
import com.avo.repositories.AppointementRepository;
import com.avo.repositories.DossierDeadlineRepository;
import com.avo.repositories.DossierRepository;
import com.avo.repositories.MailAccountRepository;
import com.avo.repositories.MatterEventRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Synchronisation (ÉCRITURE) vers Outlook Calendar (Microsoft Graph) et Google Calendar,
 * ainsi que génération de fichiers iCalendar (.ics) universels avec rappels VALARM.
 */
@Service
@Slf4j
public class ExternalCalendarSyncService {

    private static final DateTimeFormatter ICS_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final DateTimeFormatter ICS_DATETIME_UTC = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'");

    private final MailAccountRepository accountRepository;
    private final MailOAuth2Service oauth2Service;
    private final MicrosoftGraphClient microsoftClient;
    private final GoogleWorkspaceClient googleClient;
    private final DossierDeadlineRepository deadlineRepository;
    private final MatterEventRepository matterEventRepository;
    private final AppointementRepository appointementRepository;
    private final DossierRepository dossierRepository;
    private final MailIntegrationConfigService configService;

    public ExternalCalendarSyncService(MailAccountRepository accountRepository,
                                       MailOAuth2Service oauth2Service,
                                       MicrosoftGraphClient microsoftClient,
                                       GoogleWorkspaceClient googleClient,
                                       DossierDeadlineRepository deadlineRepository,
                                       MatterEventRepository matterEventRepository,
                                       AppointementRepository appointementRepository,
                                       DossierRepository dossierRepository,
                                       MailIntegrationConfigService configService) {
        this.accountRepository = accountRepository;
        this.oauth2Service = oauth2Service;
        this.microsoftClient = microsoftClient;
        this.googleClient = googleClient;
        this.deadlineRepository = deadlineRepository;
        this.matterEventRepository = matterEventRepository;
        this.appointementRepository = appointementRepository;
        this.dossierRepository = dossierRepository;
        this.configService = configService;
    }

    public record SyncResult(boolean synced, String provider, String externalEventId, String message) {}

    // ==================== SYNCHRONISATION ÉCRITURE ====================

    /** Synchronise une échéance procédurale (journée entière + rappels J-7, J-3, J-1). */
    public SyncResult syncDeadline(DossierDeadline deadline, Dossier dossier) {
        if (!configService.isEnabled()) {
            return new SyncResult(false, null, null, "Intégration calendrier désactivée");
        }
        if (deadline == null || deadline.getDateEcheanceFinale() == null) {
            return new SyncResult(false, null, null, "Échéance invalide");
        }
        Optional<MailAccount> accountOpt = resolveCalendarAccount();
        if (accountOpt.isEmpty()) {
            return new SyncResult(false, null, null, "Aucun compte Outlook ou Google Calendar actif");
        }
        MailAccount account = accountOpt.get();
        try {
            String ref = dossier != null && dossier.getReferenceInterne() != null ? " [" + dossier.getReferenceInterne() + "]" : "";
            String title = "[ÉCHÉANCE " + deadline.getCriticite() + "] " + deadline.getTitre() + ref;
            String desc = buildDeadlineDescription(deadline, dossier);
            LocalDateTime start = deadline.getDateEcheanceFinale().atStartOfDay();
            LocalDateTime end = deadline.getDateEcheanceFinale().plusDays(1).atStartOfDay();

            String extId = pushEvent(account, deadline.getExternalCalendarEventId(), title, desc, null,
                    start, end, true, List.of(10080, 4320, 1440));
            deadline.setExternalCalendarEventId(extId);
            deadline.setExternalCalendarProvider(account.getProvider());
            deadlineRepository.save(deadline);
            return new SyncResult(true, account.getProvider(), extId, "Échéance ajoutée au calendrier " + account.getProvider());
        } catch (Exception e) {
            log.warn("Échec synchronisation calendrier échéance {}: {}", deadline.getId(), e.getMessage());
            recordError(account, e.getMessage());
            return new SyncResult(false, account.getProvider(), null, e.getMessage());
        }
    }

    /** Synchronise un événement de dossier (audience, expertise, rendez-vous dossier). */
    public SyncResult syncMatterEvent(MatterEvent event, Dossier dossier) {
        if (!configService.isEnabled()) {
            return new SyncResult(false, null, null, "Intégration calendrier désactivée");
        }
        if (event == null || event.getStartDate() == null) {
            return new SyncResult(false, null, null, "Événement invalide");
        }
        Optional<MailAccount> accountOpt = resolveCalendarAccount();
        if (accountOpt.isEmpty()) {
            return new SyncResult(false, null, null, "Aucun compte Outlook ou Google Calendar actif");
        }
        MailAccount account = accountOpt.get();
        try {
            String ref = dossier != null && dossier.getReferenceInterne() != null ? " [" + dossier.getReferenceInterne() + "]" : "";
            String title = event.getTitre() + ref;
            LocalDateTime start = LocalDateTime.ofInstant(event.getStartDate().toInstant(), ZoneId.systemDefault());
            LocalDateTime end = event.getEndDate() != null
                    ? LocalDateTime.ofInstant(event.getEndDate().toInstant(), ZoneId.systemDefault())
                    : start.plusHours(1);
            int reminder = event.getReminderMinutesBefore() != null && event.getReminderMinutesBefore() > 0
                    ? event.getReminderMinutesBefore() : 60;

            String extId = pushEvent(account, event.getExternalCalendarEventId(), title, event.getDescription(),
                    event.getLieu(), start, end, event.isAllDay(), List.of(reminder));
            event.setExternalCalendarEventId(extId);
            event.setExternalCalendarProvider(account.getProvider());
            matterEventRepository.save(event);
            return new SyncResult(true, account.getProvider(), extId, "Événement ajouté au calendrier " + account.getProvider());
        } catch (Exception e) {
            log.warn("Échec synchronisation calendrier MatterEvent {}: {}", event.getId(), e.getMessage());
            recordError(account, e.getMessage());
            return new SyncResult(false, account.getProvider(), null, e.getMessage());
        }
    }

    /** Synchronise un rendez-vous / audience du calendrier global. */
    public SyncResult syncAppointement(Appointement appt) {
        if (!configService.isEnabled()) {
            return new SyncResult(false, null, null, "Intégration calendrier désactivée");
        }
        if (appt == null || appt.getDate() == null) {
            return new SyncResult(false, null, null, "Rendez-vous invalide");
        }
        Optional<MailAccount> accountOpt = resolveCalendarAccount();
        if (accountOpt.isEmpty()) {
            return new SyncResult(false, null, null, "Aucun compte Outlook ou Google Calendar actif");
        }
        MailAccount account = accountOpt.get();
        try {
            LocalDate date = toLocalDate(appt.getDate());
            LocalTime startTime = parseTime(appt.getTime(), LocalTime.of(9, 0));
            LocalTime endTime = parseTime(appt.getEndTime(), startTime.plusHours(1));
            LocalDateTime start = LocalDateTime.of(date, startTime);
            LocalDateTime end = LocalDateTime.of(date, endTime.isAfter(startTime) ? endTime : startTime.plusHours(1));

            String ref = appt.getDossier() != null && appt.getDossier().getReferenceInterne() != null
                    ? " [" + appt.getDossier().getReferenceInterne() + "]" : "";
            String title = appt.getTitle() + ref;
            String desc = "Statut : " + (appt.getStatus() != null ? appt.getStatus() : "Standard")
                    + (appt.getClientCase() != null ? "\nClient / Affaire : " + appt.getClientCase() : "");

            String extId = pushEvent(account, appt.getExternalCalendarEventId(), title, desc,
                    appt.getLocation(), start, end, false, List.of(30, 1440));
            appt.setExternalCalendarEventId(extId);
            appt.setExternalCalendarProvider(account.getProvider());
            appointementRepository.save(appt);
            return new SyncResult(true, account.getProvider(), extId, "Rendez-vous ajouté au calendrier " + account.getProvider());
        } catch (Exception e) {
            log.warn("Échec synchronisation calendrier Appointement {}: {}", appt.getId(), e.getMessage());
            recordError(account, e.getMessage());
            return new SyncResult(false, account.getProvider(), null, e.getMessage());
        }
    }

    public void deleteExternalEvent(String provider, String externalEventId) {
        if (!configService.isEnabled() || externalEventId == null || externalEventId.isBlank()) return;
        Optional<MailAccount> accountOpt = resolveCalendarAccount();
        if (accountOpt.isEmpty()) return;
        MailAccount account = accountOpt.get();
        if (provider != null && !provider.equalsIgnoreCase(account.getProvider())) return;
        try {
            String token = oauth2Service.getValidAccessToken(account);
            if (MailAccount.PROVIDER_MICROSOFT.equalsIgnoreCase(account.getProvider())) {
                microsoftClient.deleteCalendarEvent(token, externalEventId);
            } else if (MailAccount.PROVIDER_GOOGLE.equalsIgnoreCase(account.getProvider())) {
                googleClient.deleteCalendarEvent(token, account.getCalendarId(), externalEventId);
            }
        } catch (Exception e) {
            log.warn("Suppression calendrier externe ignorée : {}", e.getMessage());
        }
    }

    /** Déclenchement manuel depuis l'UI (par ID). */
    public SyncResult syncDeadlineById(Long deadlineId) {
        DossierDeadline d = deadlineRepository.findById(deadlineId)
                .orElseThrow(() -> new IllegalArgumentException("Échéance introuvable : " + deadlineId));
        Dossier dossier = dossierRepository.findById(d.getDossierId()).orElse(null);
        return syncDeadline(d, dossier);
    }

    public SyncResult syncMatterEventById(Long eventId) {
        MatterEvent e = matterEventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Événement introuvable : " + eventId));
        Dossier dossier = dossierRepository.findById(e.getDossierId()).orElse(null);
        return syncMatterEvent(e, dossier);
    }

    public SyncResult syncAppointementById(Long appointementId) {
        Appointement a = appointementRepository.findById(appointementId)
                .orElseThrow(() -> new IllegalArgumentException("Rendez-vous introuvable : " + appointementId));
        return syncAppointement(a);
    }

    // ==================== GÉNÉRATION ICS (UNIVERSAL FALLBACK) ====================

    public String buildIcsForDeadline(Long deadlineId) {
        DossierDeadline d = deadlineRepository.findById(deadlineId)
                .orElseThrow(() -> new IllegalArgumentException("Échéance introuvable : " + deadlineId));
        Dossier dossier = dossierRepository.findById(d.getDossierId()).orElse(null);
        StringBuilder sb = icsHeader("Avo-Maitrise Echeance");
        appendDeadlineVEvent(sb, d, dossier);
        sb.append("END:VCALENDAR\r\n");
        return sb.toString();
    }

    public String buildIcsForAppointement(Long appointementId) {
        Appointement a = appointementRepository.findById(appointementId)
                .orElseThrow(() -> new IllegalArgumentException("Rendez-vous introuvable : " + appointementId));
        StringBuilder sb = icsHeader("Avo-Maitrise Rendez-vous");
        appendAppointementVEvent(sb, a);
        sb.append("END:VCALENDAR\r\n");
        return sb.toString();
    }

    public String buildIcsForDossier(Long dossierId) {
        Dossier dossier = dossierRepository.findById(dossierId).orElse(null);
        StringBuilder sb = icsHeader(dossier != null ? "Dossier " + dossier.getReferenceInterne() : "Dossier Avo-Maitrise");
        for (DossierDeadline d : deadlineRepository.findByDossierIdOrderByDateEcheanceFinaleAsc(dossierId)) {
            if (!"ANNULE".equalsIgnoreCase(d.getStatut())) {
                appendDeadlineVEvent(sb, d, dossier);
            }
        }
        sb.append("END:VCALENDAR\r\n");
        return sb.toString();
    }

    public String buildIcsForUpcomingCabinetDeadlines(int daysAhead) {
        LocalDate limit = LocalDate.now().plusDays(Math.max(daysAhead, 30));
        List<DossierDeadline> list = deadlineRepository
                .findByStatutAndDateEcheanceFinaleLessThanEqualOrderByDateEcheanceFinaleAsc("ACTIF", limit);
        StringBuilder sb = icsHeader("Avo-Maitrise Echeances Cabinet");
        for (DossierDeadline d : list) {
            Dossier dossier = dossierRepository.findById(d.getDossierId()).orElse(null);
            appendDeadlineVEvent(sb, d, dossier);
        }
        sb.append("END:VCALENDAR\r\n");
        return sb.toString();
    }

    private StringBuilder icsHeader(String calName) {
        StringBuilder sb = new StringBuilder();
        sb.append("BEGIN:VCALENDAR\r\n");
        sb.append("VERSION:2.0\r\n");
        sb.append("PRODID:-//Avo-Maitrise//SI-Legal Calendar//FR\r\n");
        sb.append("CALSCALE:GREGORIAN\r\n");
        sb.append("X-WR-CALNAME:").append(escapeIcs(calName)).append("\r\n");
        return sb;
    }

    private void appendDeadlineVEvent(StringBuilder sb, DossierDeadline d, Dossier dossier) {
        String ref = dossier != null && dossier.getReferenceInterne() != null ? " [" + dossier.getReferenceInterne() + "]" : "";
        sb.append("BEGIN:VEVENT\r\n");
        sb.append("UID:avo-deadline-").append(d.getId()).append("@avo-maitrise\r\n");
        sb.append("DTSTAMP:").append(Instant.now().atOffset(ZoneOffset.UTC).format(ICS_DATETIME_UTC)).append("\r\n");
        sb.append("DTSTART;VALUE=DATE:").append(d.getDateEcheanceFinale().format(ICS_DATE)).append("\r\n");
        sb.append("DTEND;VALUE=DATE:").append(d.getDateEcheanceFinale().plusDays(1).format(ICS_DATE)).append("\r\n");
        sb.append("SUMMARY:").append(escapeIcs("[ÉCHÉANCE " + d.getCriticite() + "] " + d.getTitre() + ref)).append("\r\n");
        sb.append("DESCRIPTION:").append(escapeIcs(buildDeadlineDescription(d, dossier))).append("\r\n");
        for (String trigger : List.of("-P7D", "-P3D", "-P1D")) {
            sb.append("BEGIN:VALARM\r\n");
            sb.append("ACTION:DISPLAY\r\n");
            sb.append("TRIGGER:").append(trigger).append("\r\n");
            sb.append("DESCRIPTION:").append(escapeIcs("Rappel échéance : " + d.getTitre())).append("\r\n");
            sb.append("END:VALARM\r\n");
        }
        sb.append("END:VEVENT\r\n");
    }

    private void appendAppointementVEvent(StringBuilder sb, Appointement a) {
        LocalDate date = toLocalDate(a.getDate());
        LocalTime startTime = parseTime(a.getTime(), LocalTime.of(9, 0));
        LocalTime endTime = parseTime(a.getEndTime(), startTime.plusHours(1));
        Instant startInst = LocalDateTime.of(date, startTime).atZone(ZoneId.systemDefault()).toInstant();
        Instant endInst = LocalDateTime.of(date, endTime.isAfter(startTime) ? endTime : startTime.plusHours(1))
                .atZone(ZoneId.systemDefault()).toInstant();
        sb.append("BEGIN:VEVENT\r\n");
        sb.append("UID:avo-appt-").append(a.getId()).append("@avo-maitrise\r\n");
        sb.append("DTSTAMP:").append(Instant.now().atOffset(ZoneOffset.UTC).format(ICS_DATETIME_UTC)).append("\r\n");
        sb.append("DTSTART:").append(startInst.atOffset(ZoneOffset.UTC).format(ICS_DATETIME_UTC)).append("\r\n");
        sb.append("DTEND:").append(endInst.atOffset(ZoneOffset.UTC).format(ICS_DATETIME_UTC)).append("\r\n");
        sb.append("SUMMARY:").append(escapeIcs(a.getTitle())).append("\r\n");
        if (a.getLocation() != null && !a.getLocation().isBlank()) {
            sb.append("LOCATION:").append(escapeIcs(a.getLocation())).append("\r\n");
        }
        sb.append("BEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER:-PT30M\r\nDESCRIPTION:Rappel rendez-vous\r\nEND:VALARM\r\n");
        sb.append("END:VEVENT\r\n");
    }

    // ==================== HELPERS ====================

    private String pushEvent(MailAccount account, String existingEventId, String title, String description,
                             String location, LocalDateTime start, LocalDateTime end, boolean isAllDay,
                             List<Integer> reminders) {
        String token = oauth2Service.getValidAccessToken(account);
        if (MailAccount.PROVIDER_MICROSOFT.equalsIgnoreCase(account.getProvider())) {
            Integer firstReminder = (reminders != null && !reminders.isEmpty()) ? reminders.get(reminders.size() - 1) : 1440;
            return microsoftClient.upsertCalendarEvent(token, existingEventId, title, description, location,
                    start, end, isAllDay, firstReminder);
        } else if (MailAccount.PROVIDER_GOOGLE.equalsIgnoreCase(account.getProvider())) {
            return googleClient.upsertCalendarEvent(token, account.getCalendarId(), existingEventId, title,
                    description, location, start, end, isAllDay, reminders);
        }
        throw new IllegalStateException("Ce fournisseur ne supporte pas l'écriture calendrier API : " + account.getProvider());
    }

    private Optional<MailAccount> resolveCalendarAccount() {
        String user = getCurrentUsername();
        List<MailAccount> candidates = accountRepository.findByOwnerUsernameAndActiveTrueAndCalendarSyncEnabledTrue(user);
        if (candidates.isEmpty() && "dev-user".equals(user)) {
            candidates = accountRepository.findByActiveTrueOrderByCreatedAtDesc().stream()
                    .filter(MailAccount::isCalendarSyncEnabled).toList();
        }
        return candidates.stream()
                .filter(a -> MailAccount.PROVIDER_MICROSOFT.equalsIgnoreCase(a.getProvider())
                        || MailAccount.PROVIDER_GOOGLE.equalsIgnoreCase(a.getProvider()))
                .findFirst();
    }

    private String buildDeadlineDescription(DossierDeadline d, Dossier dossier) {
        StringBuilder sb = new StringBuilder();
        if (dossier != null) {
            sb.append("Dossier : ").append(dossier.getReferenceInterne()).append(" — ").append(dossier.getTitre()).append("\n");
        }
        sb.append("Catégorie : ").append(d.getCategorie()).append(" | Criticité : ").append(d.getCriticite()).append("\n");
        sb.append("Date de départ : ").append(d.getDateDepart()).append("\n");
        if (d.getBaseLegale() != null && !d.getBaseLegale().isBlank()) {
            sb.append("Base légale : ").append(d.getBaseLegale()).append("\n");
        }
        if (d.getDetailCalcul() != null && !d.getDetailCalcul().isBlank()) {
            sb.append("Détail du calcul : ").append(d.getDetailCalcul()).append("\n");
        }
        sb.append("\nSynchronisé automatiquement depuis Avo-Maîtrise (SI-Légal).");
        return sb.toString();
    }

    private void recordError(MailAccount account, String msg) {
        try {
            account.setLastError(msg != null && msg.length() > 480 ? msg.substring(0, 480) : msg);
            accountRepository.save(account);
        } catch (Exception ignored) {}
    }

    private String getCurrentUsername() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
                return auth.getName();
            }
        } catch (Exception ignored) {}
        return "dev-user";
    }

    private static LocalDate toLocalDate(Date d) {
        if (d instanceof java.sql.Date sqlDate) {
            return sqlDate.toLocalDate();
        }
        return d.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
    }

    private static LocalTime parseTime(String hhmm, LocalTime fallback) {
        if (hhmm == null || hhmm.isBlank()) return fallback;
        try {
            return LocalTime.parse(hhmm.trim());
        } catch (Exception e) {
            return fallback;
        }
    }

    private static String escapeIcs(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace(";", "\\;")
                .replace(",", "\\,")
                .replace("\r\n", "\\n")
                .replace("\n", "\\n");
    }
}
