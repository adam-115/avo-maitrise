package com.avo.service.ai.sources;

import java.util.Optional;

/** Vérification d'une référence auprès d'une source officielle (Judilibre pour la Cour de cassation). */
public interface OfficialReferenceChecker {

    /** Décision officielle retrouvée. */
    record OfficialDecision(String id, String number, String date, String jurisdiction, String chamber, String url) {}

    /** Résultat : trouvée, introuvable, ou vérification impossible (service désactivé ou indisponible). */
    enum Outcome { FOUND, NOT_FOUND, UNAVAILABLE }

    record Result(Outcome outcome, OfficialDecision decision) {
        public static Result unavailable() { return new Result(Outcome.UNAVAILABLE, null); }
        public static Result notFound() { return new Result(Outcome.NOT_FOUND, null); }
        public static Result found(OfficialDecision d) { return new Result(Outcome.FOUND, d); }
    }

    boolean isEnabled();

    /** @param pourvoiKey numéro normalisé, ex. « 17-28.123 » */
    Result checkPourvoi(String pourvoiKey);

    /** Recherche rapide sur Légifrance (consultation du texte, sans vérification automatique). */
    default Optional<String> legifranceSearchUrl(String query) {
        return Optional.of("https://www.legifrance.gouv.fr/search/all?tab_selection=all&searchField=ALL&query="
                + java.net.URLEncoder.encode(query, java.nio.charset.StandardCharsets.UTF_8));
    }
}
