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
public class TaskStatusDTO {
    private Long id;
    private String code;
    private String libelle;
    private Integer ordre_affichage;
    private boolean isClosingStatus;
    private Date createdAt;
}
