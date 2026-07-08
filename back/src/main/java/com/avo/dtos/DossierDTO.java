package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;
import java.util.List;
import java.util.ArrayList;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DossierDTO {
    private Long id;
    private String referenceInterne;
    private String titre;
    private String description;
    private ClientEntityDTO client;
    private String responsableId;
    private List<String> intervenantsIds = new ArrayList<>();
    private String domaineJuridique;
    private String prioriteID;
    private String statutID;
    private List<DocumentDTO> documents = new ArrayList<>();
    private Date dateOuverture;
    private Date dateCloture;
    private Date updated_at;
    private Double budgetEstime;
    private Double tauxHoraireApplique;
    private String methodeFacturation;
}
