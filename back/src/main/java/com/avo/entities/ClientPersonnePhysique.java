package com.avo.entities;

import java.sql.Date;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "personnes_physiques")
public class ClientPersonnePhysique extends ClientEntity {

    private String nom;
    private String prenom;
    private String nationalite;
    private String cin;
    
    @Column(name = "date_naissance")
    private Date dateNaissance;

    public ClientPersonnePhysique() {}

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public String getNationalite() { return nationalite; }
    public void setNationalite(String nationalite) { this.nationalite = nationalite; }

    public String getCin() { return cin; }
    public void setCin(String cin) { this.cin = cin; }

    public Date getDateNaissance() { return dateNaissance; }
    public void setDateNaissance(Date dateNaissance) { this.dateNaissance = dateNaissance; }
}
