package com.avo.dto;

public class ConflictDetailDTO {
    private Long dossierId;
    private String dossierTitre;
    private String dossierReference;
    private String role; // CLIENT_PRINCIPAL, ADVERSAIRE, etc.

    public ConflictDetailDTO() {}

    public ConflictDetailDTO(Long dossierId, String dossierTitre, String dossierReference, String role) {
        this.dossierId = dossierId;
        this.dossierTitre = dossierTitre;
        this.dossierReference = dossierReference;
        this.role = role;
    }

    public Long getDossierId() { return dossierId; }
    public void setDossierId(Long dossierId) { this.dossierId = dossierId; }
    public String getDossierTitre() { return dossierTitre; }
    public void setDossierTitre(String dossierTitre) { this.dossierTitre = dossierTitre; }
    public String getDossierReference() { return dossierReference; }
    public void setDossierReference(String dossierReference) { this.dossierReference = dossierReference; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
