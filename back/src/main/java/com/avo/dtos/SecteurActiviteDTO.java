package com.avo.dtos;

import java.util.Date;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@Builder
public class SecteurActiviteDTO {
    public SecteurActiviteDTO() {}

    public static class SecteurActiviteDTOBuilder {
        public SecteurActiviteDTOBuilder() {}
    }


    private Long id;
    private String code;
    private String libelle;
    private Long ordreAffichage;
    private boolean actif;
    private Date createdAt;

}
