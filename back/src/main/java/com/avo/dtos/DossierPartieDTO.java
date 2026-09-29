package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.avo.entities.RolePartie;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DossierPartieDTO {
    private Long id;
    private ClientEntityDTO partie;
    private RolePartie role;
}
