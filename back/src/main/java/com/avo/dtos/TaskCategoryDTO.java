package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskCategoryDTO {
    private Long id;
    private String code;
    private String libelle;
    private String couleur;
    private String icone;
    private boolean actif;
    private Date createdAt;
}
