package com.avo.dtos;

import java.util.Date;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecteurActiviteDTO {

    private Long id;
    private String code;
    private String libelle;
    private Integer ordreAffichage;
    private boolean actif;
    private Date createdAt;

}
