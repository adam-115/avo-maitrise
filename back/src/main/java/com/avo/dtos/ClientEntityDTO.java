package com.avo.dtos;

import java.util.Date;
import java.util.List;
import com.avo.entities.ClientStatus;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
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
    private List<ScreeningMatchDTO> screeningMatchDTOs ;
    
    // Personne Physique fields
    private String nom;
    private String prenom;
    private String nationalite;
    private String cin;
    private Date dateNaissance;

    // Client Moral / Societe fields
    private String nomCommercial;
    private String formeJuridique;
    private String numeroRegistreCommerce;
    private String numeroIdFiscal;
    
    // Representant Legal fields
    private String nomRepresentantLegal;
    private String prenomRepresentantLegal;
    private String nationaliteRepresentantLegal;
    private String cinRepresentantLegal;
    private Date dateNaissanceRepresentantLegal;

    // Association / Institution fields
    private String numeroRegistreNational;

    private List<UBODTO> ubos;

}
