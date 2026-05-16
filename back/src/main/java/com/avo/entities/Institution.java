package com.avo.entities;

import java.util.Date;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "institutions")
public class Institution extends ClientEntity {

    private String nom;
    private String numeroRegistreNational;
    private String numeroIdFiscal;
    private String nomRepresentantLegal;
    private String prenomRepresentantLegal;
    private String nationaliteRepresentantLegal;
    private String cinRepresentantLegal;
    private Date dateNaissanceRepresentantLegal;

    public Institution() {}

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getNumeroRegistreNational() { return numeroRegistreNational; }
    public void setNumeroRegistreNational(String numeroRegistreNational) { this.numeroRegistreNational = numeroRegistreNational; }

    public String getNumeroIdFiscal() { return numeroIdFiscal; }
    public void setNumeroIdFiscal(String numeroIdFiscal) { this.numeroIdFiscal = numeroIdFiscal; }

    public String getNomRepresentantLegal() { return nomRepresentantLegal; }
    public void setNomRepresentantLegal(String nomRepresentantLegal) { this.nomRepresentantLegal = nomRepresentantLegal; }

    public String getPrenomRepresentantLegal() { return prenomRepresentantLegal; }
    public void setPrenomRepresentantLegal(String prenomRepresentantLegal) { this.prenomRepresentantLegal = prenomRepresentantLegal; }

    public String getNationaliteRepresentantLegal() { return nationaliteRepresentantLegal; }
    public void setNationaliteRepresentantLegal(String nationaliteRepresentantLegal) { this.nationaliteRepresentantLegal = nationaliteRepresentantLegal; }

    public String getCinRepresentantLegal() { return cinRepresentantLegal; }
    public void setCinRepresentantLegal(String cinRepresentantLegal) { this.cinRepresentantLegal = cinRepresentantLegal; }

    public Date getDateNaissanceRepresentantLegal() { return dateNaissanceRepresentantLegal; }
    public void setDateNaissanceRepresentantLegal(Date dateNaissanceRepresentantLegal) { this.dateNaissanceRepresentantLegal = dateNaissanceRepresentantLegal; }
}
