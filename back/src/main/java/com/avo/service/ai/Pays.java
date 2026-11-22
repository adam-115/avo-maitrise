package com.avo.service.ai;

import java.text.Normalizer;
import java.util.Map;
import java.util.Set;

/**
 * Normalise un pays vers l'une des valeurs utilisées pour classer la jurisprudence
 * (cf. écran Gestion jurisprudence). Accepte "France", "FRANCE", "FR"... ; sinon FRANCE.
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

    public static String normalize(String pays) {
        if (pays == null || pays.isBlank()) {
            return PAR_DEFAUT;
        }
        String normalized = Normalizer.normalize(pays.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toUpperCase();
        normalized = CODES.getOrDefault(normalized, normalized);
        return CONNUS.contains(normalized) ? normalized : PAR_DEFAUT;
    }
}
