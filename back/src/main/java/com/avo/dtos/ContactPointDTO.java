package com.avo.dtos;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ContactPointDTO {

    public ContactPointDTO() {}

    public ContactPointDTO(Long id, String nom, String prenom, String email, String telephone, String occupation, String adresse) {
        this.id = id;
        this.nom = nom;
        this.prenom = prenom;
        this.email = email;
        this.telephone = telephone;
        this.occupation = occupation;
        this.adresse = adresse;
    }

    public static class ContactPointDTOBuilder {
        public ContactPointDTOBuilder() {}
    }

    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private String telephone;
    private String occupation;
    private String adresse;

}
