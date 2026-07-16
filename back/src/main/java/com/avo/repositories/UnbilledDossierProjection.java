package com.avo.repositories;

public interface UnbilledDossierProjection {
    Long getDossierId();
    String getDossierTitre();
    String getReferenceInterne();
    Long getClientId();
    Long getUnbilledMinutes();
    Double getUnbilledAmountHT();
}
