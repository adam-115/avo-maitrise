package com.avo.audit.timeline;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Un événement de la chronologie d'audit : une modification (révision Envers) ou un accès (audit_log).
 *
 * @param category    MODIFICATION ou ACCES
 * @param action      CREATION, MODIFICATION, SUPPRESSION, AJOUT, RETRAIT, CONSULTATION, TELECHARGEMENT, EXPORT, ACCES_IA...
 * @param resourceType type technique (CLIENT, ALERTE_LCBFT, DILIGENCE...)
 * @param resourceLabel libellé lisible (« Alerte LCB-FT #3 – Jean Dupond »)
 * @param changes     détail champ par champ (modifications uniquement)
 * @param reference   n° de révision (modification) ou de ligne de journal (accès), pour retrouver la preuve en base
 */
public record TimelineEntry(
        LocalDateTime time,
        String user,
        String ipAddress,
        String origin,
        String category,
        String action,
        String resourceType,
        String resourceId,
        String resourceLabel,
        String summary,
        List<FieldChange> changes,
        String outcome,
        Long reference) {

    public record FieldChange(String field, String label, String before, String after) {}
}
