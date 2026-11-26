package com.avo.services.export;

import com.avo.entities.CabinetProfile;
import com.avo.entities.ClientPersonnePhysique;
import com.avo.entities.Dossier;
import com.avo.repositories.CabinetProfileRepository;
import com.avo.repositories.DossierRepository;
import com.avo.repositories.NoteRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.io.ByteArrayInputStream;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

class WordExportServiceTest {

    @Test
    void exportDossierStrategyGeneratesValidReadableDocxWithSources() throws Exception {
        DossierRepository dossierRepo = Mockito.mock(DossierRepository.class);
        NoteRepository noteRepo = Mockito.mock(NoteRepository.class);
        CabinetProfileRepository cabinetRepo = Mockito.mock(CabinetProfileRepository.class);

        CabinetProfile cabinet = new CabinetProfile();
        cabinet.setName("Cabinet Moreau & Associés");
        cabinet.setCity("Lyon");

        ClientPersonnePhysique client = new ClientPersonnePhysique();
        client.setNom("Moreau");
        client.setPrenom("Marc");

        Dossier dossier = new Dossier();
        dossier.setId(1497L);
        dossier.setReferenceInterne("DOS-SOC-2026-MOREAU");
        dossier.setTitre("Licenciement abusif Moreau");
        dossier.setPaysJuridiction("FRANCE");
        dossier.setClient(client);
        dossier.setAiStrategy("""
                ### Synthèse des enjeux
                Le salarié conteste un **licenciement sans cause réelle et sérieuse** [S1].
                - Indemnité compensatrice de préavis
                - Dommages et intérêts barème Macron
                """);
        dossier.setAiStrategySources("""
                {"sources":[{"id":"S1","kind":"DOCUMENT","title":"Lettre_licenciement.pdf","page":2,"excerpt":"Notification du licenciement"}]}
                """);

        Mockito.when(dossierRepo.findById(1497L)).thenReturn(Optional.of(dossier));
        Mockito.when(cabinetRepo.findAll()).thenReturn(List.of(cabinet));

        WordExportService svc = new WordExportService(dossierRepo, noteRepo, cabinetRepo, new ObjectMapper());
        WordExportService.ExportedDocx result = svc.exportDossierStrategy(1497L);

        assertEquals("Strategie_DOS-SOC-2026-MOREAU.docx", result.filename());
        assertTrue(result.bytes().length > 1000);

        try (XWPFDocument parsed = new XWPFDocument(new ByteArrayInputStream(result.bytes()))) {
            String allParagraphs = parsed.getParagraphs().stream()
                    .map(p -> p.getText())
                    .collect(Collectors.joining("\n"));
            assertTrue(allParagraphs.contains("CABINET MOREAU"));
            assertTrue(allParagraphs.contains("Synthèse des enjeux"));
            assertTrue(allParagraphs.contains("licenciement sans cause réelle et sérieuse"));
            assertTrue(allParagraphs.contains("[S1]"));
            // Tableau métadonnées + tableau sources
            assertEquals(2, parsed.getTables().size());
        }
    }
}
