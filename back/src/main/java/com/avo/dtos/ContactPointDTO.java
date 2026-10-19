package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@Builder
public class ContactPointDTO {

    public ContactPointDTO() {}

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
