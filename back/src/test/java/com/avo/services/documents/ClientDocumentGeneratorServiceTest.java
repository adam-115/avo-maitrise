package com.avo.services.documents;

import com.avo.entities.*;
import com.avo.repositories.CabinetProfileRepository;
import com.avo.repositories.ClientRepository;
import com.avo.repositories.DocumentRepository;
import com.avo.repositories.DossierRepository;
import com.avo.service.AiConfigurationService;
import com.avo.services.MinioService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class ClientDocumentGeneratorServiceTest {

    @Test
    void searchModelsReturnsMultipleMatchingContractsForChoice() {
        DocumentRepository docRepo = mock(DocumentRepository.class);
        ClientRepository clientRepo = mock(ClientRepository.class);
        CabinetProfileRepository cabinetRepo = mock(CabinetProfileRepository.class);
        MinioService minio = mock(MinioService.class);
        AiConfigurationService aiConfig = mock(AiConfigurationService.class);

        Document d1 = new Document();
        d1.setId(1L);
        d1.setTitle("Contrat de prestation juridique");
        d1.setNomFichier("contrat_prestation.docx");
        d1.setTags("CONTRACT");
        d1.setTypeDocument(DocumentType.MODEL);

        Document d2 = new Document();
        d2.setId(2L);
        d2.setTitle("Convention d'honoraires forfaitaire");
        d2.setNomFichier("convention_honoraires.docx");
        d2.setTags("CONTRACT");
        d2.setTypeDocument(DocumentType.MODEL);

        Document d3 = new Document();
        d3.setId(3L);
        d3.setTitle("Questionnaire KYC");
        d3.setNomFichier("kyc_client.docx");
        d3.setTags("KYC");
        d3.setTypeDocument(DocumentType.MODEL);

        when(docRepo.findByTypeDocument(DocumentType.MODEL)).thenReturn(List.of(d1, d2, d3));
        when(aiConfig.isAiEnabled()).thenReturn(false);

        ClientDocumentGeneratorService service = new ClientDocumentGeneratorService(
                docRepo, clientRepo, mock(DossierRepository.class), cabinetRepo, minio, aiConfig, new ObjectMapper()
        );

        ClientDocumentGeneratorService.ModelSearchResult res = service.searchModels("génère moi le contrat avec le client");

        assertThat(res.matches()).hasSize(2);
        assertThat(res.matches().get(0).id()).isEqualTo(1L);
        assertThat(res.matches().get(1).id()).isEqualTo(2L);
    }

    @Test
    void generateDocumentFillsDocxPlaceholdersInPlaceWithClientAndCabinetData() throws Exception {
        DocumentRepository docRepo = mock(DocumentRepository.class);
        ClientRepository clientRepo = mock(ClientRepository.class);
        CabinetProfileRepository cabinetRepo = mock(CabinetProfileRepository.class);
        MinioService minio = mock(MinioService.class);
        AiConfigurationService aiConfig = mock(AiConfigurationService.class);

        // Créer un mini .docx en mémoire avec balises
        byte[] templateBytes;
        try (XWPFDocument tpl = new XWPFDocument(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            tpl.createParagraph().createRun().setText("CONTRAT ENTRE {{CABINET_NOM}} ET {{CLIENT_NOM}} (RC: {{RC}})");
            tpl.write(baos);
            templateBytes = baos.toByteArray();
        }

        ClientMoral cm = new ClientMoral();
        cm.setId(10L);
        cm.setNomCommercial("ATLAS TECH SARL");
        cm.setNumeroRegistreCommerce("RC-998877");
        cm.setEmail("contact@atlastech.ma");

        CabinetProfile cab = new CabinetProfile();
        cab.setName("Cabinet Benali & Associés");

        Document model = new Document();
        model.setId(5L);
        model.setTitle("Contrat Cadre");
        model.setNomFichier("contrat_cadre.docx");
        model.setMinioObjectId("obj-5");

        when(clientRepo.findById(10L)).thenReturn(Optional.of(cm));
        when(docRepo.findById(5L)).thenReturn(Optional.of(model));
        when(cabinetRepo.findAll()).thenReturn(List.of(cab));
        when(minio.getFileStream("obj-5")).thenReturn(new ByteArrayInputStream(templateBytes));
        when(aiConfig.isAiEnabled()).thenReturn(false);

        ClientDocumentGeneratorService service = new ClientDocumentGeneratorService(
                docRepo, clientRepo, mock(DossierRepository.class), cabinetRepo, minio, aiConfig, new ObjectMapper()
        );

        ClientDocumentGeneratorService.GeneratedDocumentResult out = service.generateDocument(10L, 5L, null, false);

        assertThat(out.generationMode()).isEqualTo("DOCX_TEMPLATE");
        assertThat(out.filename()).endsWith(".docx");
        try (XWPFDocument generated = new XWPFDocument(new ByteArrayInputStream(out.docxBytes()))) {
            String text = generated.getParagraphs().stream().map(XWPFParagraph::getText).reduce("", String::concat);
            assertThat(text).contains("Cabinet Benali & Associés");
            assertThat(text).contains("ATLAS TECH SARL");
            assertThat(text).contains("RC-998877");
        }
    }
}
