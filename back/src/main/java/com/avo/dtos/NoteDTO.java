package com.avo.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@NoArgsConstructor
public class NoteDTO {
    private Long id;
    private Long dossierId;
    private Long auteurId;
    private String title;
    private String description;
    private Long categoryId;
    private String categoryLabel;
    private String categoryColor;
    private Date createdAt;
    private Date updatedAt;
}
