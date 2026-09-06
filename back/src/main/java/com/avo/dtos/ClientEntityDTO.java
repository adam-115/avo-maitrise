package com.avo.dtos;

import java.util.Date;
import java.util.List;
import com.avo.entities.ClientStatus;

public class ClientEntityDTO {

    private Long id;
    private String email;
    private String telephone;
    private String adresse;
    private String pays;
    private String type;
    private ClientStatus clientStatus;
    private String secteurActivite;
    private List<DocumentDTO> documents;
    private List<ContactPointDTO> contacts;
    private List<ScreeningMatchDTO> screeningMatchDTOs;
    private Date createdAt;
    private Long version;
    
    private String nom;
    private String prenom;
    private String nationalite;
    private String cin;
    private Date dateNaissance;

    private String nomCommercial;
    private String formeJuridique;
    private String numeroRegistreCommerce;
    private String numeroIdFiscal;
    
    private String nomRepresentantLegal;
    private String prenomRepresentantLegal;
    private String nationaliteRepresentantLegal;
    private String cinRepresentantLegal;
    private Date dateNaissanceRepresentantLegal;

    private String numeroRegistreNational;

    private List<UBODTO> ubos;

    public ClientEntityDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getTelephone() { return telephone; }
    public void setTelephone(String telephone) { this.telephone = telephone; }

    public String getAdresse() { return adresse; }
    public void setAdresse(String adresse) { this.adresse = adresse; }

    public String getPays() { return pays; }
    public void setPays(String pays) { this.pays = pays; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public ClientStatus getClientStatus() { return clientStatus; }
    public void setClientStatus(ClientStatus clientStatus) { this.clientStatus = clientStatus; }

    public String getSecteurActivite() { return secteurActivite; }
    public void setSecteurActivite(String secteurActivite) { this.secteurActivite = secteurActivite; }

    public List<DocumentDTO> getDocuments() { return documents; }
    public void setDocuments(List<DocumentDTO> documents) { this.documents = documents; }

    public List<ContactPointDTO> getContacts() { return contacts; }
    public void setContacts(List<ContactPointDTO> contacts) { this.contacts = contacts; }

    public List<ScreeningMatchDTO> getScreeningMatchDTOs() { return screeningMatchDTOs; }
    public void setScreeningMatchDTOs(List<ScreeningMatchDTO> screeningMatchDTOs) { this.screeningMatchDTOs = screeningMatchDTOs; }

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

    public String getNomCommercial() { return nomCommercial; }
    public void setNomCommercial(String nomCommercial) { this.nomCommercial = nomCommercial; }

    public String getFormeJuridique() { return formeJuridique; }
    public void setFormeJuridique(String formeJuridique) { this.formeJuridique = formeJuridique; }

    public String getNumeroRegistreCommerce() { return numeroRegistreCommerce; }
    public void setNumeroRegistreCommerce(String numeroRegistreCommerce) { this.numeroRegistreCommerce = numeroRegistreCommerce; }

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

    public String getNumeroRegistreNational() { return numeroRegistreNational; }
    public void setNumeroRegistreNational(String numeroRegistreNational) { this.numeroRegistreNational = numeroRegistreNational; }

    public List<UBODTO> getUbos() { return ubos; }
    public void setUbos(List<UBODTO> ubos) { this.ubos = ubos; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
}
