package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldResultDTO {
    private Long id;
    private String fieldConfigId;
    private String fieldOptionId;
    private String value;
}
