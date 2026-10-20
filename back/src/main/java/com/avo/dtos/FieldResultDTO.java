package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@Builder
public class FieldResultDTO {
    public FieldResultDTO() {}

    public static class FieldResultDTOBuilder {
        public FieldResultDTOBuilder() {}
    }

    private Long id;
    private String fieldConfigId;
    private String fieldOptionId;
    private String value;
}
