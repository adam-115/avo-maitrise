package com.avo.dtos;

import java.time.LocalDateTime;

import com.fasterxml.jackson.databind.JsonNode;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScreeningMatchDTO {

    private Long id;
    private ClientEntityDTO clientEntityDTO;
    private UBODTO uboDTO;
    private ScreeningExecutionDTO screeningExecutionDTO;
    private String yenteId;
    private Double score;
    private String targetName;
    private JsonNode rawResponse;
    private LocalDateTime createdAt;
    private String matchReason;
    private String status; // Using String for DTO to avoid enum serialization issues if preferred, but usually Enum is better. I'll use String for compatibility with existing patterns if any.
    private String reviewerComment;
    private LocalDateTime reviewedAt;
    private String reviewedBy;
    private String yenteLastUpdate;

}
