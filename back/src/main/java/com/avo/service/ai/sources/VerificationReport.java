package com.avo.service.ai.sources;

import java.util.List;

/**
 * Verdict de la vérification automatique d'une réponse de l'IA.
 *
 * Statuts :
 * - VERIFIEE      : toutes les affirmations juridiques sont rattachées à une source réelle ;
 * - PARTIELLE     : sources valides, mais certains passages ne citent aucune source ;
 * - A_CONTROLER   : au moins une référence, citation ou source n'a pas pu être vérifiée ;
 * - NON_SOURCEE   : des sources ont été consultées mais la réponse n'en cite aucune ;
 * - SANS_SOURCE   : aucune source consultée et aucune référence juridique (réponse générale).
 */
public record VerificationReport(
        String status,
        String statusLabel,
        List<String> citedSources,
        List<CheckedReference> references,
        List<Issue> issues,
        boolean officialCheckEnabled) {

    /** Un problème repéré, avec le texte exact concerné (pour le surligner dans l'interface). */
    public record Issue(String type, String severity, String text, String message) {}

    /**
     * Une référence juridique contrôlée.
     * status : TROUVEE_DANS_SOURCE, VERIFIEE_OFFICIELLE, NON_VERIFIEE, INTROUVABLE
     */
    public record CheckedReference(String kind, String text, String key, String status, String sourceId,
            String officialUrl, String message) {}
}
