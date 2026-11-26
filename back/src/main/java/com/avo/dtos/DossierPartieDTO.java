package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.avo.entities.RolePartie;

@Data
@AllArgsConstructor
@Builder
public class DossierPartieDTO {
    public DossierPartieDTO() {}

    public static class DossierPartieDTOBuilder {
        public DossierPartieDTOBuilder() {}
    }

    private Long id;
    private ClientEntityDTO partie;
    private RolePartie role;
}
