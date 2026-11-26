package com.avo.service.ai;

import java.text.Normalizer;
import java.util.Map;
import java.util.Set;

/**
 * Normalise un pays vers l'une des valeurs utilisées pour classer la jurisprudence
 * (cf. écran Gestion jurisprudence). Accepte "France", "FRANCE", "FR", "Belgium"... ; sinon FRANCE
 * ({@link #normalize}) ou null ({@link #normalizeOrNull}).
 *
 * Le résultat est toujours une valeur connue : il peut être inséré sans risque dans un filtre Qdrant.
 */
public final class Pays {

    public static final String PAR_DEFAUT = "FRANCE";

    private static final Set<String> CONNUS = Set.of("FRANCE", "LUXEMBOURG", "BELGIQUE", "ALLEMAGNE", "SUISSE",
            "INTERNATIONAL");
    private static final Map<String, String> CODES = Map.of("FR", "FRANCE", "LU", "LUXEMBOURG", "BE", "BELGIQUE",
            "DE", "ALLEMAGNE", "CH", "SUISSE");

    private Pays() {
    }

    /** Pays mentionné dans une question (« en droit luxembourgeois », « en Belgique »...), sinon FRANCE. */
    public static String detect(String question) {
        if (question == null) {
            return PAR_DEFAUT;
        }
        String q = Normalizer.normalize(question, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase();
        if (q.contains("luxembourg")) return "LUXEMBOURG";
        if (q.contains("belg")) return "BELGIQUE";
        if (q.contains("suisse")) return "SUISSE";
        if (q.contains("allemand") || q.contains("allemagne")) return "ALLEMAGNE";
        if (q.contains("international") || q.contains("europeen") || q.contains("cjue") || q.contains("cedh")) return "INTERNATIONAL";
        return PAR_DEFAUT;
    }

    public static final String INTERNATIONAL = "INTERNATIONAL";

    public static String normalize(String pays) {
        String known = normalizeOrNull(pays);
        return known == null ? PAR_DEFAUT : known;
    }

    /**
     * Comme {@link #normalize}, mais renvoie null pour un pays non géré (Maroc, Espagne...) au lieu de FRANCE :
     * utilisé pour le pays de juridiction d'un dossier, qui ne doit jamais être deviné en silence.
     */
    public static String normalizeOrNull(String pays) {
        if (pays == null || pays.isBlank()) {
            return null;
        }
        String normalized = Normalizer.normalize(pays.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toUpperCase();
        normalized = CODES.getOrDefault(normalized, ALIASES.getOrDefault(normalized, normalized));
        return CONNUS.contains(normalized) ? normalized : null;
    }

    /** Noms anglais fréquents dans les fiches clients. */
    private static final Map<String, String> ALIASES = Map.of("BELGIUM", "BELGIQUE", "GERMANY", "ALLEMAGNE",
            "SWITZERLAND", "SUISSE", "DEUTSCHLAND", "ALLEMAGNE", "SCHWEIZ", "SUISSE");

    /**
     * Pays dont on cherche les textes pour un droit applicable donné : le pays lui-même + l'international
     * (CJUE, CEDH, conventions), qui s'applique dans tous les pays gérés.
     */
    public static java.util.List<String> perimetre(String pays) {
        String p = normalize(pays);
        return INTERNATIONAL.equals(p) ? java.util.List.of(INTERNATIONAL) : java.util.List.of(p, INTERNATIONAL);
    }
}
