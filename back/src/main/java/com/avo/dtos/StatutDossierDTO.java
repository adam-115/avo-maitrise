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
public class StatutDossierDTO {
    private Long id;
    private String code;
    private String label;
    private String color;
    private boolean active;
    private Integer order; // Named 'order' to match frontend expected property
    private Date createdAt;
}
