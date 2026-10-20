package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@AllArgsConstructor
@Builder
public class TaskStatusDTO {
    public TaskStatusDTO() {}

    public static class TaskStatusDTOBuilder {
        public TaskStatusDTOBuilder() {}
    }

    private Long id;
    private String code;
    private String libelle;
    private Integer ordre_affichage;
    private boolean isClosingStatus;
    private Date createdAt;
}
