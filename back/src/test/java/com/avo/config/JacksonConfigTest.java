package com.avo.config;

import com.avo.dtos.DocumentDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JacksonConfigTest {

    /** JSON d'upload contenant un fichier de la taille donnée, encodé en base64 (comme le front). */
    private static String uploadJson(int fileSizeBytes) {
        int base64Length = (fileSizeBytes + 2) / 3 * 4;
        return "{\"nomFichier\":\"Code de commerce.pdf\",\"fileData\":\"data:application/pdf;base64,"
                + "A".repeat(base64Length) + "\"}";
    }

    @Test
    void default_jackson_rejects_a_31_mb_document() {
        ObjectMapper defaultMapper = new ObjectMapper();
        assertThatThrownBy(() -> defaultMapper.readValue(uploadJson(31_336_868), DocumentDTO.class))
                .hasMessageContaining("exceeds the maximum allowed");
    }

    @Test
    void configured_mapper_accepts_documents_up_to_50_mb() throws Exception {
        Jackson2ObjectMapperBuilder builder = new Jackson2ObjectMapperBuilder();
        new JacksonConfig().largeDocumentUploads().customize(builder);
        ObjectMapper mapper = builder.build();

        // Le Code de commerce (31,3 Mo) qui échouait, puis la limite d'upload de l'application (50 Mo)
        assertThat(mapper.readValue(uploadJson(31_336_868), DocumentDTO.class).getFileData()).hasSizeGreaterThan(40_000_000);
        assertThat(mapper.readValue(uploadJson(50 * 1024 * 1024), DocumentDTO.class).getFileData()).hasSizeGreaterThan(65_000_000);
    }
}
