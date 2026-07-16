package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UnbilledDossierSummaryDTO {
    private Long dossierId;
    private String dossierTitre;
    private String referenceInterne;
    private Long clientId;
    private String clientName;
    private long unbilledMinutes;
    private double unbilledAmountHT;
}
