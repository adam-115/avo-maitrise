package com.avo.audit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Trace automatiquement l'appel d'un point d'accès sensible dans le journal des consultations.
 *
 * <pre>
 * &#64;AuditAccess(action = AuditAction.CONSULTATION, resource = "DOSSIER")
 * &#64;GetMapping("/{id}")
 * public DossierDTO findById(&#64;PathVariable Long id) { ... }
 * </pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface AuditAccess {

    AuditAction action();

    /** Type de ressource : DOSSIER, CLIENT, DOCUMENT, ALERTE_LCBFT, DILIGENCE, FACTURE, UBO... */
    String resource();

    /** Nom du paramètre de la méthode qui porte l'identifiant de la ressource (vide si aucun). */
    String idParam() default "id";

    /** Précision libre ajoutée à la trace (ex. « rapport KYC »). */
    String details() default "";
}
