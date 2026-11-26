package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@AllArgsConstructor
@Builder
public class TaskCategoryDTO {
    public TaskCategoryDTO() {}

    public static class TaskCategoryDTOBuilder {
        public TaskCategoryDTOBuilder() {}
    }

    private Long id;
    private String code;
    private String libelle;
    private String couleur;
    private String icone;
    private boolean actif;
    private Date createdAt;
}
