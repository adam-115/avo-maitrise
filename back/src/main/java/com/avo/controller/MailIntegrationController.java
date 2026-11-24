package com.avo.controller;

import com.avo.dtos.mail.DossierEmailDTO;
import com.avo.dtos.mail.FileEmailRequest;
import com.avo.dtos.mail.InboxEmailDTO;
import com.avo.dtos.mail.MailAccountDTO;
import com.avo.entities.MailAccount;
import com.avo.services.mail.ExternalCalendarSyncService;
import com.avo.services.mail.MailIntegrationConfigService;
import com.avo.services.mail.MailIntegrationService;
import com.avo.services.mail.MailOAuth2Service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * API REST pour l'intégration Messagerie (lecture seule : Outlook / Gmail / IMAP + .eml)
 * et Calendrier externe (écriture : Outlook Calendar / Google Calendar + export .ics).
 */
@RestController
@RequestMapping("/api/mail-integration")
@CrossOrigin(origins = "*")
@Slf4j
public class MailIntegrationController {

    private final MailIntegrationService mailService;
    private final MailOAuth2Service oauth2Service;
    private final ExternalCalendarSyncService calendarSyncService;
    private final MailIntegrationConfigService configService;

    public MailIntegrationController(MailIntegrationService mailService,
                                     MailOAuth2Service oauth2Service,
                                     ExternalCalendarSyncService calendarSyncService,
                                     MailIntegrationConfigService configService) {
        this.mailService = mailService;
        this.oauth2Service = oauth2Service;
        this.calendarSyncService = calendarSyncService;
        this.configService = configService;
    }

    // ==================== ACTIVATION OPTIONNELLE ====================

    @GetMapping("/status")
    public ResponseEntity<Map<String, Boolean>> getStatus() {
        return ResponseEntity.ok(Map.of("enabled", configService.isEnabled()));
    }

    @PutMapping("/status")
    public ResponseEntity<Map<String, Boolean>> setStatus(@RequestParam boolean enabled) {
        return ResponseEntity.ok(Map.of("enabled", configService.setEnabled(enabled)));
    }

    // ==================== CONFIGURATION & COMPTES ====================

    @GetMapping("/providers/status")
    public ResponseEntity<Map<String, Object>> getProvidersStatus() {
        return ResponseEntity.ok(oauth2Service.getProvidersConfigStatus());
    }

    @GetMapping("/accounts")
    public ResponseEntity<List<MailAccountDTO>> listAccounts() {
        return ResponseEntity.ok(mailService.listMyAccounts());
    }

    @PostMapping("/accounts/imap")
    public ResponseEntity<?> connectImap(@RequestBody MailAccountDTO dto) {
        try {
            return ResponseEntity.ok(mailService.connectImapAccount(dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/accounts/{id}/calendar-sync")
    public ResponseEntity<MailAccountDTO> toggleCalendarSync(@PathVariable Long id,
                                                             @RequestParam boolean enabled) {
        return ResponseEntity.ok(mailService.updateCalendarSync(id, enabled));
    }

    @DeleteMapping("/accounts/{id}")
    public ResponseEntity<Void> deleteAccount(@PathVariable Long id) {
        mailService.deleteAccount(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== OAUTH2 MICROSOFT 365 & GOOGLE ====================

    @GetMapping("/oauth/{provider}/authorize")
    public ResponseEntity<?> getAuthorizeUrl(@PathVariable String provider) {
        try {
            String url = oauth2Service.buildAuthorizeUrl(provider, mailService.getCurrentUsername());
            return ResponseEntity.ok(Map.of("authorizeUrl", url));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/oauth/{provider}/callback")
    public ResponseEntity<Void> oauthCallback(@PathVariable String provider,
                                              @RequestParam(required = false) String code,
                                              @RequestParam(required = false) String state,
                                              @RequestParam(required = false) String error,
                                              @RequestParam(name = "error_description", required = false) String errorDesc) {
        String base = oauth2Service.getFrontendRedirectBase() + "/home/messagerie";
        if (error != null && !error.isBlank()) {
            String msg = URLEncoder.encode(errorDesc != null ? errorDesc : error, StandardCharsets.UTF_8);
            return ResponseEntity.status(302).location(URI.create(base + "?oauthError=" + msg)).build();
        }
        try {
            MailAccount account = oauth2Service.handleCallback(provider, code, state);
            String email = URLEncoder.encode(account.getEmailAddress(), StandardCharsets.UTF_8);
            return ResponseEntity.status(302)
                    .location(URI.create(base + "?oauthSuccess=" + provider.toUpperCase() + "&email=" + email))
                    .build();
        } catch (Exception e) {
            log.error("Erreur callback OAuth2 {}: {}", provider, e.getMessage());
            String msg = URLEncoder.encode(e.getMessage() != null ? e.getMessage() : "Erreur OAuth2", StandardCharsets.UTF_8);
            return ResponseEntity.status(302).location(URI.create(base + "?oauthError=" + msg)).build();
        }
    }

    // ==================== BOÎTE DE RÉCEPTION (LECTURE SEULE) ====================

    @GetMapping("/accounts/{accountId}/inbox")
    public ResponseEntity<?> listInbox(@PathVariable Long accountId,
                                       @RequestParam(required = false) String query,
                                       @RequestParam(defaultValue = "25") int limit) {
        try {
            return ResponseEntity.ok(mailService.listInbox(accountId, query, limit));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/accounts/{accountId}/messages/detail")
    public ResponseEntity<?> getMessageDetail(@PathVariable Long accountId,
                                              @RequestParam String messageId) {
        try {
            InboxEmailDTO dto = mailService.getMessageDetail(accountId, messageId);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ==================== CLASSEMENT DANS UN DOSSIER ====================

    @PostMapping("/file")
    public ResponseEntity<?> fileEmail(@RequestBody FileEmailRequest req) {
        try {
            return ResponseEntity.ok(mailService.fileEmailToDossier(req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/dossiers/{dossierId}/import-eml")
    public ResponseEntity<?> importEml(@PathVariable Long dossierId,
                                       @RequestParam("file") MultipartFile file,
                                       @RequestParam(defaultValue = "true") boolean importAttachments) {
        try {
            return ResponseEntity.ok(mailService.importEmlToDossier(dossierId, file, importAttachments));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/dossiers/{dossierId}/emails")
    public ResponseEntity<List<DossierEmailDTO>> listDossierEmails(@PathVariable Long dossierId) {
        return ResponseEntity.ok(mailService.listDossierEmails(dossierId));
    }

    @DeleteMapping("/dossiers/emails/{emailId}")
    public ResponseEntity<Void> deleteDossierEmail(@PathVariable Long emailId) {
        mailService.deleteDossierEmail(emailId);
        return ResponseEntity.noContent().build();
    }

    // ==================== CALENDRIER (ÉCRITURE + EXPORT .ICS) ====================

    @PostMapping("/calendar/sync/deadline/{deadlineId}")
    public ResponseEntity<ExternalCalendarSyncService.SyncResult> syncDeadline(@PathVariable Long deadlineId) {
        return ResponseEntity.ok(calendarSyncService.syncDeadlineById(deadlineId));
    }

    @PostMapping("/calendar/sync/matter-event/{eventId}")
    public ResponseEntity<ExternalCalendarSyncService.SyncResult> syncMatterEvent(@PathVariable Long eventId) {
        return ResponseEntity.ok(calendarSyncService.syncMatterEventById(eventId));
    }

    @PostMapping("/calendar/sync/appointement/{appointementId}")
    public ResponseEntity<ExternalCalendarSyncService.SyncResult> syncAppointement(@PathVariable Long appointementId) {
        return ResponseEntity.ok(calendarSyncService.syncAppointementById(appointementId));
    }

    @GetMapping(value = "/calendar/ics/deadline/{deadlineId}", produces = "text/calendar;charset=UTF-8")
    public ResponseEntity<byte[]> downloadDeadlineIcs(@PathVariable Long deadlineId) {
        String ics = calendarSyncService.buildIcsForDeadline(deadlineId);
        return icsResponse(ics, "echeance-" + deadlineId + ".ics");
    }

    @GetMapping(value = "/calendar/ics/appointement/{appointementId}", produces = "text/calendar;charset=UTF-8")
    public ResponseEntity<byte[]> downloadAppointementIcs(@PathVariable Long appointementId) {
        String ics = calendarSyncService.buildIcsForAppointement(appointementId);
        return icsResponse(ics, "rdv-" + appointementId + ".ics");
    }

    @GetMapping(value = "/calendar/ics/dossier/{dossierId}", produces = "text/calendar;charset=UTF-8")
    public ResponseEntity<byte[]> downloadDossierIcs(@PathVariable Long dossierId) {
        String ics = calendarSyncService.buildIcsForDossier(dossierId);
        return icsResponse(ics, "dossier-" + dossierId + "-echeances.ics");
    }

    @GetMapping(value = "/calendar/ics/cabinet", produces = "text/calendar;charset=UTF-8")
    public ResponseEntity<byte[]> downloadCabinetDeadlinesIcs(@RequestParam(defaultValue = "90") int days) {
        String ics = calendarSyncService.buildIcsForUpcomingCabinetDeadlines(days);
        return icsResponse(ics, "avo-maitrise-echeances.ics");
    }

    private ResponseEntity<byte[]> icsResponse(String ics, String filename) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/calendar; charset=UTF-8"))
                .body(ics.getBytes(StandardCharsets.UTF_8));
    }
}
