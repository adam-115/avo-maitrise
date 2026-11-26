package com.avo.services.billing;

import com.avo.entities.*;
import com.avo.mappers.InvoiceDossierServiceMapper;
import com.avo.repositories.*;
import com.avo.service.AiConfigurationService;
import com.avo.services.CurrentUserInfoService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class PrestationAiAuditServiceTest {

    private PrestationAiAuditService buildService(
            DossierRepository dossierRepo,
            InvoiceDossierServiceRepository prestationRepo,
            InvoiceTypeOfServiceRepository typeRepo,
            NoteRepository noteRepo,
            TaskRepository taskRepo,
            AppointementRepository appointRepo,
            MatterEventRepository eventRepo,
            DossierEmailRepository emailRepo,
            MailIntegrationConfigRepository mailConfigRepo,
            PrestationAiDecisionRepository decisionRepo,
            AiConfigurationService aiConfig) {
        return new PrestationAiAuditService(
                dossierRepo, prestationRepo, typeRepo, noteRepo, taskRepo,
                appointRepo, eventRepo, emailRepo, mailConfigRepo, decisionRepo,
                mock(UserRepository.class), mock(CurrentUserInfoService.class),
                mock(InvoiceDossierServiceMapper.class), aiConfig, new ObjectMapper()
        );
    }

    @Test
    void auditSkipsEmailsWhenMailModuleDisabledAndUsesOtherElements() {
        DossierRepository dossierRepo = mock(DossierRepository.class);
        InvoiceDossierServiceRepository prestationRepo = mock(InvoiceDossierServiceRepository.class);
        InvoiceTypeOfServiceRepository typeRepo = mock(InvoiceTypeOfServiceRepository.class);
        NoteRepository noteRepo = mock(NoteRepository.class);
        TaskRepository taskRepo = mock(TaskRepository.class);
        AppointementRepository appointRepo = mock(AppointementRepository.class);
        MatterEventRepository eventRepo = mock(MatterEventRepository.class);
        DossierEmailRepository emailRepo = mock(DossierEmailRepository.class);
        MailIntegrationConfigRepository mailConfigRepo = mock(MailIntegrationConfigRepository.class);
        PrestationAiDecisionRepository decisionRepo = mock(PrestationAiDecisionRepository.class);
        AiConfigurationService aiConfig = mock(AiConfigurationService.class);

        Dossier d = new Dossier();
        d.setId(42L);
        d.setReferenceInterne("DOS-2026-42");
        d.setTitre("Litige commercial");

        MailIntegrationConfig disabledMail = new MailIntegrationConfig();
        disabledMail.setEnabled(false);

        InvoiceTypeOfService type = new InvoiceTypeOfService();
        type.setId(1L);
        type.setCode("AUD");
        type.setDescription("Audience");
        type.setActif(true);
        type.setPrice5min(new BigDecimal("50.00"));

        Appointement app = new Appointement();
        app.setId(10L);
        app.setTitle("Audience TPI Casablanca");
        app.setDate(new Date());
        app.setTime("09:00");
        app.setEndTime("10:00");

        when(dossierRepo.findById(42L)).thenReturn(Optional.of(d));
        when(mailConfigRepo.findById(1L)).thenReturn(Optional.of(disabledMail));
        when(prestationRepo.findByDossier_Id(42L)).thenReturn(List.of());
        when(typeRepo.findAll()).thenReturn(List.of(type));
        when(decisionRepo.findByDossierId(42L)).thenReturn(List.of());
        when(noteRepo.findByDossier_Id(42L)).thenReturn(List.of());
        when(taskRepo.findByDossierId(42L)).thenReturn(List.of());
        when(appointRepo.findByDossier_Id(42L)).thenReturn(List.of(app));
        when(eventRepo.findByDossierId(42L)).thenReturn(List.of());
        when(aiConfig.isAiEnabled()).thenReturn(false);

        PrestationAiAuditService service = buildService(
                dossierRepo, prestationRepo, typeRepo, noteRepo, taskRepo,
                appointRepo, eventRepo, emailRepo, mailConfigRepo, decisionRepo, aiConfig
        );

        PrestationAiAuditService.AuditResult result = service.auditDossier(42L);

        assertThat(result.emailsIncluded()).isFalse();
        assertThat(result.proposals()).hasSize(1);
        assertThat(result.proposals().get(0).sourceKey()).isEqualTo("APPOINTMENT:10");
        assertThat(result.proposals().get(0).nbrOfMinutes()).isEqualTo(60);
        verifyNoInteractions(emailRepo);
    }

    @Test
    void auditIncludesEmailsWhenMailModuleEnabledAndRespectsRejectedDecisions() {
        DossierRepository dossierRepo = mock(DossierRepository.class);
        InvoiceDossierServiceRepository prestationRepo = mock(InvoiceDossierServiceRepository.class);
        InvoiceTypeOfServiceRepository typeRepo = mock(InvoiceTypeOfServiceRepository.class);
        NoteRepository noteRepo = mock(NoteRepository.class);
        TaskRepository taskRepo = mock(TaskRepository.class);
        AppointementRepository appointRepo = mock(AppointementRepository.class);
        MatterEventRepository eventRepo = mock(MatterEventRepository.class);
        DossierEmailRepository emailRepo = mock(DossierEmailRepository.class);
        MailIntegrationConfigRepository mailConfigRepo = mock(MailIntegrationConfigRepository.class);
        PrestationAiDecisionRepository decisionRepo = mock(PrestationAiDecisionRepository.class);
        AiConfigurationService aiConfig = mock(AiConfigurationService.class);

        Dossier d = new Dossier();
        d.setId(42L);

        MailIntegrationConfig enabledMail = new MailIntegrationConfig();
        enabledMail.setEnabled(true);

        DossierEmail e1 = new DossierEmail();
        e1.setId(100L);
        e1.setSubject("Analyse du contrat de bail");
        e1.setSentAt(LocalDateTime.now());

        DossierEmail e2 = new DossierEmail();
        e2.setId(101L);
        e2.setSubject("Email déjà refusé");
        e2.setSentAt(LocalDateTime.now());

        PrestationAiDecision rejected = new PrestationAiDecision();
        rejected.setDossierId(42L);
        rejected.setSourceKey("EMAIL:101");
        rejected.setDecision("REJECTED");

        when(dossierRepo.findById(42L)).thenReturn(Optional.of(d));
        when(mailConfigRepo.findById(1L)).thenReturn(Optional.of(enabledMail));
        when(prestationRepo.findByDossier_Id(42L)).thenReturn(List.of());
        when(typeRepo.findAll()).thenReturn(List.of());
        when(decisionRepo.findByDossierId(42L)).thenReturn(List.of(rejected));
        when(noteRepo.findByDossier_Id(42L)).thenReturn(List.of());
        when(taskRepo.findByDossierId(42L)).thenReturn(List.of());
        when(appointRepo.findByDossier_Id(42L)).thenReturn(List.of());
        when(eventRepo.findByDossierId(42L)).thenReturn(List.of());
        when(emailRepo.findByDossierIdOrderBySentAtDescFiledAtDesc(42L)).thenReturn(List.of(e1, e2));
        when(aiConfig.isAiEnabled()).thenReturn(false);

        PrestationAiAuditService service = buildService(
                dossierRepo, prestationRepo, typeRepo, noteRepo, taskRepo,
                appointRepo, eventRepo, emailRepo, mailConfigRepo, decisionRepo, aiConfig
        );

        PrestationAiAuditService.AuditResult result = service.auditDossier(42L);

        assertThat(result.emailsIncluded()).isTrue();
        assertThat(result.ignoredDecisionsCount()).isEqualTo(1);
        assertThat(result.proposals()).hasSize(1);
        assertThat(result.proposals().get(0).sourceKey()).isEqualTo("EMAIL:100");
    }
}
