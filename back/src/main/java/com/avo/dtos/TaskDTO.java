package com.avo.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
public class TaskDTO {
    private Long id;
    private Long dossierId;
    private String titre;
    private String description;
    private TaskCategoryDTO category;
    private TaskStatusDTO status;
    private String priorite;
    private List<UserDTO> assignees;
    private Date dateEcheance;
    private boolean isCompleted;
    private Date createdAt;
    private UserDTO createdBy;
    private String invoiceId;
    private Integer estimatedTimeMinutes;
}
