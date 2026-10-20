package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.OffsetDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@Builder
public class FormConfigDTO {
    public FormConfigDTO() {}

    public static class FormConfigDTOBuilder {
        public FormConfigDTOBuilder() {}
    }

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
