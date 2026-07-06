package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceDossierServieStatusDTO {
    private Long id;
    private String color;
    private String name;
    private String code;
    private String description;
    private boolean active;
    private UserDTO createdByUser;
}
