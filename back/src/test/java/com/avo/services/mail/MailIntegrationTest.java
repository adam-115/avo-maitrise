package com.avo.services.mail;

import com.avo.entities.Dossier;
import com.avo.entities.DossierDeadline;
import com.avo.repositories.AppointementRepository;
import com.avo.repositories.DossierDeadlineRepository;
import com.avo.repositories.DossierRepository;
import com.avo.repositories.MailAccountRepository;
import com.avo.repositories.MatterEventRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class MailIntegrationTest {

    @Test
    void cryptoEncryptDecryptRoundTrip() {
        MailCredentialCrypto crypto = new MailCredentialCrypto("test-secret-key-2026");
        String secret = "refresh_token_eyJhbGciOiJSUzI1NiJ9_abc123";
        String enc1 = crypto.encrypt(secret);
        String enc2 = crypto.encrypt(secret);

        assertNotNull(enc1);
        assertNotEquals(secret, enc1);
        assertNotEquals(enc1, enc2, "Chaque chiffrement doit utiliser un IV aléatoire différent");
        assertEquals(secret, crypto.decrypt(enc1));
        assertEquals(secret, crypto.decrypt(enc2));
    }

    @Test
    void parseSimpleEmlExtractsHeadersAndBody() {
        String rawEml = "From: Marc Moreau <marc.moreau@example.fr>\r\n"
                + "To: cabinet@avo-maitrise.fr\r\n"
                + "Subject: Piece justificative DOS-SOC-2026-MOREAU\r\n"
                + "Message-ID: <test-msg-001@example.fr>\r\n"
                + "Content-Type: text/plain; charset=UTF-8\r\n"
                + "\r\n"
                + "Bonjour Maitre, veuillez trouver ci-joint mon contrat de travail.";

        ImapReadOnlyClient client = new ImapReadOnlyClient();
        ImapReadOnlyClient.ParsedEmail parsed = client.parseEmlBytes(rawEml.getBytes(StandardCharsets.UTF_8));

        assertEquals("marc.moreau@example.fr", parsed.dto().getFromEmail());
        assertEquals("Marc Moreau", parsed.dto().getFromName());
        assertEquals("Piece justificative DOS-SOC-2026-MOREAU", parsed.dto().getSubject());
        assertEquals("<test-msg-001@example.fr>", parsed.dto().getExternalMessageId());
        assertTrue(parsed.dto().getBodyText().contains("contrat de travail"));
    }

    @Test
    void buildIcsForDeadlineContainsDateAndValarms() {
        DossierDeadlineRepository deadlineRepo = Mockito.mock(DossierDeadlineRepository.class);
        DossierRepository dossierRepo = Mockito.mock(DossierRepository.class);

        DossierDeadline d = new DossierDeadline();
        d.setId(42L);
        d.setDossierId(1497L);
        d.setTitre("Appel jugement CPH");
        d.setCategorie("APPEL");
        d.setCriticite("CRITIQUE");
        d.setDateDepart(LocalDate.of(2026, 11, 1));
        d.setDateEcheanceFinale(LocalDate.of(2026, 12, 1));
        d.setBaseLegale("Art. R. 1461-1 Code du travail");

        Dossier dossier = new Dossier();
        dossier.setId(1497L);
        dossier.setReferenceInterne("DOS-SOC-2026-MOREAU");
        dossier.setTitre("Licenciement sans cause réelle");

        Mockito.when(deadlineRepo.findById(42L)).thenReturn(Optional.of(d));
        Mockito.when(dossierRepo.findById(1497L)).thenReturn(Optional.of(dossier));

        ExternalCalendarSyncService svc = new ExternalCalendarSyncService(
                Mockito.mock(MailAccountRepository.class),
                Mockito.mock(MailOAuth2Service.class),
                Mockito.mock(MicrosoftGraphClient.class),
                Mockito.mock(GoogleWorkspaceClient.class),
                deadlineRepo,
                Mockito.mock(MatterEventRepository.class),
                Mockito.mock(AppointementRepository.class),
                dossierRepo,
                Mockito.mock(MailIntegrationConfigService.class)
        );

        String ics = svc.buildIcsForDeadline(42L);
        assertTrue(ics.contains("BEGIN:VCALENDAR"));
        assertTrue(ics.contains("DTSTART;VALUE=DATE:20261201"));
        assertTrue(ics.contains("DOS-SOC-2026-MOREAU"));
        assertTrue(ics.contains("TRIGGER:-P7D"));
        assertTrue(ics.contains("TRIGGER:-P3D"));
        assertTrue(ics.contains("TRIGGER:-P1D"));
        assertTrue(ics.contains("END:VCALENDAR"));
    }
}
