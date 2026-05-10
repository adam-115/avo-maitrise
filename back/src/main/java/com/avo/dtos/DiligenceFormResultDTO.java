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
public class DiligenceFormResultDTO {
    private String id;
    private String formConfigId;
    private Long clientId;
    private OffsetDateTime creationDate;
    private OffsetDateTime lastUpdateDate;
    private List<FieldResultDTO> fieldResults;
}
