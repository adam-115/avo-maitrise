package com.avo.service.ai.sources;

import java.util.Map;

/**
 * Une source consultée par l'IA pendant une réponse, numérotée S1, S2...
 * C'est le logiciel qui l'enregistre (jamais le modèle) : l'IA ne peut citer que ce qu'elle a réellement lu.
 *
 * @param id          identifiant cité dans la réponse (S1, S2...)
 * @param kind        DOCUMENT (pièce d'un dossier), JURISPRUDENCE (base du cabinet) ou DONNEE (fiche du logiciel)
 * @param title       libellé lisible (« Bail_commercial_Martin.pdf », « Fiche client #12 »)
 * @param documentId  document stocké (téléchargeable), sinon null
 * @param page        page du document (si connue)
 * @param excerpt     extrait affiché à l'avocat (début du passage)
 * @param text        texte complet du passage, utilisé pour vérifier citations et références
 * @param link        lien interne (route de l'application) pour les données du logiciel
 * @param officialUrl lien vers le texte officiel (Judilibre, Légifrance...) si connu
 * @param details     fiche de la décision : juridiction, date, numéro, ECLI (jurisprudence)
 */
public record SourceRef(
        String id,
        String kind,
        String title,
        Long documentId,
        Integer page,
        String excerpt,
        @com.fasterxml.jackson.annotation.JsonIgnore String text,
        String link,
        String officialUrl,
        Map<String, String> details) {

    public static final String DOCUMENT = "DOCUMENT";
    public static final String JURISPRUDENCE = "JURISPRUDENCE";
    public static final String LEGISLATION = "LEGISLATION";
    public static final String DONNEE = "DONNEE";
}
