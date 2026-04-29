package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactPointDTO {

    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private String telephone;
    private String occupation;
    private String adresse;

}
