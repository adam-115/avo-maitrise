package com.avo.audit;

public enum AuditOutcome {
    SUCCES,
    /** L'utilisateur n'avait pas le droit d'accéder à la ressource. */
    REFUSE,
    /** La ressource n'existe pas ou une erreur est survenue. */
    ECHEC
}
