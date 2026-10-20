package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
public class UnbilledDossierSummaryDTO {
    public UnbilledDossierSummaryDTO() {}

    private Long dossierId;
    private String dossierTitre;
    private String referenceInterne;
    private Long clientId;
    private String clientName;
    private long unbilledMinutes;
    private double unbilledAmountHT;
}
