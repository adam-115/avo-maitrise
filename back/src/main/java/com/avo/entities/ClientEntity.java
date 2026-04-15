package com.avo.entities;

import jakarta.persistence.*;
import java.util.Date;
import java.util.UUID;

@Entity
@Table(name = "clients")
public class ClientEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    private ClientTypeEnum type;

    private String nom;
    private String prenom;
    private String email;
    private String telephone;

    @Column(name = "secteur_activite")
    private String secteurActivite;

    @Column(name = "pays_residance")
    private String paysResidance;

    @Column(name = "risk_score")
    private Double riskScore;

    private String adresse;

    @Enumerated(EnumType.STRING)
    @Column(name = "client_status")
    private ClientStatus clientStatus;

    @Column(name = "aml_analysis_status")
    private String amlAnalysisStatus; // TODO, OK, SUSPECT, BLOCKED

    @Column(name = "aml_match_score")
    private Double amlMatchScore;

    @Column(name = "aml_target_entity_name")
    private String amlTargetEntityName;

    @Column(name = "aml_sanction_reason")
    private String amlSanctionReason;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "aml_last_verification_date")
    private Date amlLastVerificationDate;

    // Default constructor is required by JPA
    public ClientEntity() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public ClientTypeEnum getType() {
        return type;
    }

    public void setType(ClientTypeEnum type) {
        this.type = type;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getPrenom() {
        return prenom;
    }

    public void setPrenom(String prenom) {
        this.prenom = prenom;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTelephone() {
        return telephone;
    }

    public void setTelephone(String telephone) {
        this.telephone = telephone;
    }

    public String getSecteurActivite() {
        return secteurActivite;
    }

    public void setSecteurActivite(String secteurActivite) {
        this.secteurActivite = secteurActivite;
    }

    public String getPaysResidance() {
        return paysResidance;
    }

    public void setPaysResidance(String paysResidance) {
        this.paysResidance = paysResidance;
    }

    public Double getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(Double riskScore) {
        this.riskScore = riskScore;
    }

    public String getAdresse() {
        return adresse;
    }

    public void setAdresse(String adresse) {
        this.adresse = adresse;
    }

    public ClientStatus getClientStatus() {
        return clientStatus;
    }

    public void setClientStatus(ClientStatus clientStatus) {
        this.clientStatus = clientStatus;
    }

    public String getAmlAnalysisStatus() {
        return amlAnalysisStatus;
    }

    public void setAmlAnalysisStatus(String amlAnalysisStatus) {
        this.amlAnalysisStatus = amlAnalysisStatus;
    }

    public Double getAmlMatchScore() {
        return amlMatchScore;
    }

    public void setAmlMatchScore(Double amlMatchScore) {
        this.amlMatchScore = amlMatchScore;
    }

    public String getAmlTargetEntityName() {
        return amlTargetEntityName;
    }

    public void setAmlTargetEntityName(String amlTargetEntityName) {
        this.amlTargetEntityName = amlTargetEntityName;
    }

    public String getAmlSanctionReason() {
        return amlSanctionReason;
    }

    public void setAmlSanctionReason(String amlSanctionReason) {
        this.amlSanctionReason = amlSanctionReason;
    }

    public Date getAmlLastVerificationDate() {
        return amlLastVerificationDate;
    }

    public void setAmlLastVerificationDate(Date amlLastVerificationDate) {
        this.amlLastVerificationDate = amlLastVerificationDate;
    }
}
