package com.avo.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@NoArgsConstructor
public class DossierContactDTO {
    private Long id;
    private Long dossierId;
    private String civilite;
    private String nom;
    private String prenom;
    private String entreprise;
    private String email;
    private String telephoneFixe;
    private String telephoneMobile;
    private String adresse;
    private String numToque;
    private String siteWeb;
    private String pays;
    private String profession;
    private String observation;
    private String notes;
    private Date createdAt;
    private Date updatedAt;
}
