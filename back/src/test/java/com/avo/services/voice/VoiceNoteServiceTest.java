package com.avo.services.voice;

import com.avo.entities.ClientPersonnePhysique;
import com.avo.entities.Dossier;
import com.avo.repositories.DossierRepository;
import com.avo.service.AiConfigurationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class VoiceNoteServiceTest {

    @Test
    void suggestsMatchingDossierAndFallsBackGracefullyWhenAiDisabled() {
        DossierRepository dossierRepo = Mockito.mock(DossierRepository.class);
        AiConfigurationService aiConfig = Mockito.mock(AiConfigurationService.class);

        ClientPersonnePhysique client = new ClientPersonnePhysique();
        client.setNom("Moreau");
        client.setPrenom("Marc");

        Dossier d = new Dossier();
        d.setId(1497L);
        d.setReferenceInterne("DOS-SOC-2026-MOREAU");
        d.setTitre("Licenciement abusif Moreau");
        d.setClient(client);

        Mockito.when(dossierRepo.findAll()).thenReturn(List.of(d));
        Mockito.when(aiConfig.isAiEnabled()).thenReturn(false);

        VoiceNoteService svc = new VoiceNoteService(dossierRepo, aiConfig, new ObjectMapper());
        VoiceNoteService.StructuredVoiceNote res = svc.structureTranscript(
                "Je sors de l'audience Moreau au CPH de Lyon, renvoi accordé au 15 janvier.", null);

        assertFalse(res.aiEnhanced());
        assertNotNull(res.suggestedDossier());
        assertEquals(1497L, res.suggestedDossier().dossierId());
        assertEquals("DOS-SOC-2026-MOREAU", res.suggestedDossier().referenceInterne());
        assertTrue(res.structuredContent().contains("audience Moreau"));
    }
}
