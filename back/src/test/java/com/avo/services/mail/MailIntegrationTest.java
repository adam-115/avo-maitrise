package com.avo.services.mail;

import com.avo.entities.Appointement;
import com.avo.repositories.AppointementRepository;
import com.avo.repositories.DossierRepository;
import com.avo.repositories.MailAccountRepository;
import com.avo.repositories.MatterEventRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.nio.charset.StandardCharsets;
import java.sql.Date;
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
    void buildIcsForAppointementContainsEventAndAlarm() {
        AppointementRepository apptRepo = Mockito.mock(AppointementRepository.class);

        Appointement a = new Appointement();
        a.setId(77L);
        a.setTitle("Audience CPH Lyon");
        a.setLocation("Tribunal de Lyon");
        a.setDate(Date.valueOf(LocalDate.of(2026, 12, 10)));
        a.setTime("09:30");
        a.setEndTime("11:00");
        a.setStatus("Urgent");

        Mockito.when(apptRepo.findById(77L)).thenReturn(Optional.of(a));

        ExternalCalendarSyncService svc = new ExternalCalendarSyncService(
                Mockito.mock(MailAccountRepository.class),
                Mockito.mock(MailOAuth2Service.class),
                Mockito.mock(MicrosoftGraphClient.class),
                Mockito.mock(GoogleWorkspaceClient.class),
                Mockito.mock(MatterEventRepository.class),
                apptRepo,
                Mockito.mock(DossierRepository.class),
                Mockito.mock(MailIntegrationConfigService.class)
        );

        String ics = svc.buildIcsForAppointement(77L);
        assertTrue(ics.contains("BEGIN:VCALENDAR"));
        assertTrue(ics.contains("SUMMARY:Audience CPH Lyon"));
        assertTrue(ics.contains("LOCATION:Tribunal de Lyon"));
        assertTrue(ics.contains("TRIGGER:-PT30M"));
        assertTrue(ics.contains("END:VCALENDAR"));
    }
}
