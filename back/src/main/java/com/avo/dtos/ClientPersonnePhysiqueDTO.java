package com.avo.dtos;

import java.sql.Date;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ClientPersonnePhysiqueDTO extends ClientEntityDTO {

    private String nom;
    private String prenom;
    private String nationalite;
    private String cin;
    private Date dateNaissance;

}
