package com.avo.config;

import com.fasterxml.jackson.core.StreamReadConstraints;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Les documents sont envoyés par le front encodés en base64 dans le JSON (champ fileData). Jackson refuse par
 * défaut toute chaîne de plus de 20 millions de caractères, soit un fichier d'environ 15 Mo seulement.
 *
 * La limite est alignée sur celle des uploads (50 Mo, cf. spring.servlet.multipart.max-file-size) :
 * 50 Mo en base64 ≈ 67 millions de caractères, d'où 100 millions avec une marge.
 */
@Configuration
public class JacksonConfig {

    static final int MAX_JSON_STRING_LENGTH = 100_000_000;

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer largeDocumentUploads() {
        return builder -> builder.postConfigurer(mapper -> mapper.getFactory().setStreamReadConstraints(
                StreamReadConstraints.builder().maxStringLength(MAX_JSON_STRING_LENGTH).build()));
    }
}
