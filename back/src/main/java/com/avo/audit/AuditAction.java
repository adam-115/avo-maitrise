package com.avo.audit;

/** Types d'accès tracés dans le journal des consultations. Les modifications, elles, sont historisées par Envers. */
public enum AuditAction {
    /** Ouverture d'une fiche : dossier, client, document, alerte LCB-FT, diligence, facture... */
    CONSULTATION,
    /** Téléchargement d'un fichier stocké (pièce, document). */
    TELECHARGEMENT,
    /** Génération d'un rapport ou d'un export (PDF de conformité, facture...). */
    EXPORT,
    /** Données lues par l'assistant IA pour le compte de l'utilisateur. */
    ACCES_IA,
    /** Déclenchement manuel d'un filtrage sanctions / personnes politiquement exposées. */
    DECLENCHEMENT_FILTRAGE
}
