package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@Builder
public class FieldConfigDTO {
    public FieldConfigDTO() {}

    public static class FieldConfigDTOBuilder {
        public FieldConfigDTOBuilder() {}
    }

    private String id;
    private String name;
    private String type;
    private String label;
    private boolean required;
    private String errorMessage;
    private String placeholder;
    private List<FieldOptionDTO> options;
}
