package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;
import java.util.List;
import java.util.ArrayList;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DossierDTO {
    private Long id;

    @Size(max = 50, message = "La référence interne ne doit pas dépasser 50 caractères")
    private String referenceInterne;

    @NotBlank(message = "Le titre du dossier est obligatoire")
    @Size(max = 255, message = "Le titre du dossier ne doit pas dépasser 255 caractères")
    private String titre;

    @Size(max = 2000, message = "La description ne doit pas dépasser 2000 caractères")
    private String description;

    private ClientEntityDTO client;
    private String responsableId;
    private String createdBy;
    private List<String> intervenantsIds = new ArrayList<>();

    private String domaineJuridique;
    private String prioriteID;
    private String statutID;
    private List<DocumentDTO> documents = new ArrayList<>();
    private Date dateOuverture;
    private Date dateCloture;
    private Date updated_at;
}
