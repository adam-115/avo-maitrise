package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldConfigDTO {
    private String id;
    private String name;
    private String type;
    private String label;
    private boolean required;
    private String errorMessage;
    private String placeholder;
    private List<FieldOptionDTO> options;
}
