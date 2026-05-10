package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.OffsetDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FormConfigDTO {
    private String id;
    private String type;
    private String targetClientType;
    private String name;
    private String title;
    private String description;
    private List<FieldConfigDTO> fields;
    private OffsetDateTime creationDate;
    private OffsetDateTime lastUpdateDate;
}
