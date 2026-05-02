package com.avo.dtos;

import java.time.LocalDateTime;

import com.avo.entities.ScreeningExecutionStatus;
import com.fasterxml.jackson.databind.JsonNode;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScreeningExecutionDTO {

    private Long id;
    private ClientEntityDTO clientEntityDTO; // reference to ClientEntity
    private UBODTO uboDTO;// reference to UBO
    private JsonNode rawResponse;
    private LocalDateTime createdAt;
    private String executionMessage;
    private ScreeningExecutionStatus status ;

}
