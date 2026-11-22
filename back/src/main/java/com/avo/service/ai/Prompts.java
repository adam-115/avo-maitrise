package com.avo.service.ai;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Charge les prompts depuis src/main/resources/prompts/*.txt et remplace les variables {{nom}}.
 *
 * Les prompts sont des fichiers texte : on peut les modifier sans toucher au code Java.
 * Le remplacement est un simple "chercher / remplacer", sans moteur de template, pour que des
 * accolades présentes dans les documents ou la stratégie ne cassent jamais le rendu.
 */
@Component
public class Prompts {

    private final Map<String, String> cache = new ConcurrentHashMap<>();

    /**
     * @param name      nom du fichier sans extension (ex: "strategie")
     * @param variables paires nom → valeur (ex: "pays", "FRANCE")
     */
    public String render(String name, String... variables) {
        if (variables.length % 2 != 0) {
            throw new IllegalArgumentException("Les variables doivent être fournies par paires nom/valeur");
        }
        String text = cache.computeIfAbsent(name, Prompts::load);
        for (int i = 0; i < variables.length; i += 2) {
            String value = variables[i + 1] != null ? variables[i + 1] : "";
            text = text.replace("{{" + variables[i] + "}}", value);
        }
        return text;
    }

    private static String load(String name) {
        ClassPathResource resource = new ClassPathResource("prompts/" + name + ".txt");
        try (InputStream in = resource.getInputStream()) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("Prompt introuvable : prompts/" + name + ".txt", e);
        }
    }
}
