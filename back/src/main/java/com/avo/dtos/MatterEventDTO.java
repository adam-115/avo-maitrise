package com.avo.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
public class MatterEventDTO {
    private Long id;
    private Long dossierId;
    private String titre;
    private String description;
    private EventTypeDTO categorie;
    private Date startDate;
    private Date endDate;
    private boolean isAllDay;
    private String lieu;
    private List<String> participantsIds;
    private Integer reminderMinutesBefore;
    private String statut;
    private Date createdAt;
    private Date updatedAt;
}
