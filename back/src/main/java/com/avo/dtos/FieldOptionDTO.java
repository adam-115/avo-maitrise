package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@Builder
public class FieldOptionDTO {
    public FieldOptionDTO() {}

    public static class FieldOptionDTOBuilder {
        public FieldOptionDTOBuilder() {}
    }

    private String id;
    private String name;
    private String value;
}
