package com.avo.entities;

import java.util.Date;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "clients_moraux")
public class ClientMoral extends ClientEntity {

    private String nomCommercial;
    private String formeJuridique;
    private String numeroRegistreCommerce;
    private String numeroIdFiscal;
    private String nomRepresentantLegal;
    private String prenomRepresentantLegal;
    private String nationaliteRepresentantLegal;
    private String cinRepresentantLegal;
    private Date dateNaissanceRepresentantLegal;

    @OneToMany(mappedBy = "clientMoral", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UBO> ubos;

    public ClientMoral() {}

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

    public List<UBO> getUbos() { return ubos; }
    public void setUbos(List<UBO> ubos) { this.ubos = ubos; }

    @Override
    public void linkChildren() {
        super.linkChildren();
        if (ubos != null) {
            ubos.forEach(u -> u.setClientMoral(this));
        }
    }
}
