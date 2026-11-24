package com.avo.services.conflict;

import com.avo.dtos.conflict.ConflictCheckDTOs.*;
import com.avo.entities.*;
import com.avo.repositories.ClientRepository;
import com.avo.repositories.ConflictCheckRepository;
import com.avo.repositories.DossierRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ConflictCheckServiceTest {

    @Test
    void detectsDirectClientVsAdversaryAndUboAndDirigeant() {
        ClientRepository clientRepo = Mockito.mock(ClientRepository.class);
        DossierRepository dossierRepo = Mockito.mock(DossierRepository.class);
        ConflictCheckRepository checkRepo = Mockito.mock(ConflictCheckRepository.class);
        ApplicationEventPublisher publisher = Mockito.mock(ApplicationEventPublisher.class);

        ClientMoral societeAlpha = new ClientMoral();
        societeAlpha.setId(10L);
        societeAlpha.setNomCommercial("Alpha Conseil SAS");
        societeAlpha.setEmail("contact@alpha.fr");
        societeAlpha.setNomRepresentantLegal("Moreau");
        societeAlpha.setPrenomRepresentantLegal("Marc");

        UBO ubo = new UBO();
        ubo.setId(1L);
        ubo.setFullName("Sophie Laurent");
        ubo.setClientMoral(societeAlpha);
        societeAlpha.setUbos(List.of(ubo));

        ClientPersonnePhysique marcMoreau = new ClientPersonnePhysique();
        marcMoreau.setId(20L);
        marcMoreau.setNom("Moreau");
        marcMoreau.setPrenom("Marc");
        marcMoreau.setEmail("marc.moreau@gmail.com");

        Dossier existingDossier = new Dossier();
        existingDossier.setId(100L);
        existingDossier.setReferenceInterne("DOS-2026-ALPHA");
        existingDossier.setTitre("Litige Commercial Alpha");
        existingDossier.setClient(societeAlpha);

        Mockito.when(clientRepo.findAll()).thenReturn(List.of(societeAlpha, marcMoreau));
        Mockito.when(dossierRepo.findAll()).thenReturn(List.of(existingDossier));

        ConflictCheckService svc = new ConflictCheckService(clientRepo, dossierRepo, checkRepo, publisher, new ObjectMapper());

        // 1. Alpha Conseil ajouté comme ADVERSAIRE -> CRITICAL (CLIENT_DIRECT)
        CheckRequest req1 = new CheckRequest();
        req1.setParties(List.of(new PartyInput(10L, "ADVERSAIRE", null)));
        CheckResponse res1 = svc.checkConflicts(req1);
        assertTrue(res1.isHasConflict());
        assertEquals("CRITICAL", res1.getRiskLevel());
        assertTrue(res1.isRequiresJustification());
        assertTrue(res1.getMatches().stream().anyMatch(m -> "CLIENT_DIRECT".equals(m.getMatchType())));

        // 2. Marc Moreau ajouté comme ADVERSAIRE -> HIGH (DIRIGEANT de Alpha Conseil)
        CheckRequest req2 = new CheckRequest();
        req2.setParties(List.of(new PartyInput(20L, "ADVERSAIRE", null)));
        CheckResponse res2 = svc.checkConflicts(req2);
        assertTrue(res2.isHasConflict());
        assertTrue(res2.getMatches().stream().anyMatch(m -> "DIRIGEANT".equals(m.getMatchType())));

        // 3. Recherche libre "Sophie Laurent" -> HIGH (UBO de Alpha Conseil)
        CheckRequest req3 = new CheckRequest();
        req3.setFreeTextQueries(List.of("Sophie Laurent"));
        CheckResponse res3 = svc.checkConflicts(req3);
        assertTrue(res3.isHasConflict());
        assertTrue(res3.getMatches().stream().anyMatch(m -> "UBO".equals(m.getMatchType())));
    }

    @Test
    void enforcesMandatoryJustificationForHighOrCriticalWaiver() {
        ConflictCheckService svc = new ConflictCheckService(
                Mockito.mock(ClientRepository.class),
                Mockito.mock(DossierRepository.class),
                Mockito.mock(ConflictCheckRepository.class),
                Mockito.mock(ApplicationEventPublisher.class),
                new ObjectMapper()
        );

        RecordRequest bad = new RecordRequest();
        bad.setDossierId(1L);
        bad.setRiskLevel("CRITICAL");
        bad.setDecision("PROCEEDED_WITH_WAIVER");
        bad.setJustification("   ");

        assertThrows(IllegalArgumentException.class, () -> svc.recordCheck(bad));
    }
}
