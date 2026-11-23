package com.avo.service.ai.sources;

/**
 * Droit applicable imposé pour la réponse en cours (pays choisi par l'avocat dans le chat, ou pays de
 * juridiction du dossier pour l'analyse stratégique).
 *
 * Quand il est défini, l'outil de recherche de jurisprudence l'utilise à la place du pays que le modèle
 * pourrait demander : l'IA ne peut pas aller chercher dans un autre droit que celui choisi par l'avocat.
 * Il vit dans le thread de la requête, comme {@link SourceRegistry}.
 */
public final class AiJurisdiction {

    private static final ThreadLocal<String> CURRENT = new ThreadLocal<>();

    private AiJurisdiction() {}

    public static void set(String pays) {
        CURRENT.set(pays);
    }

    /** Pays imposé, ou null si le modèle est libre de choisir. */
    public static String get() {
        return CURRENT.get();
    }

    public static void clear() {
        CURRENT.remove();
    }
}
