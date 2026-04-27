package com.avo.dtos;

import java.time.LocalDateTime;

import com.fasterxml.jackson.databind.JsonNode;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScreeningLogMatchDTO {

    private Long id;
    private Long clientId; // reference to ClientEntity
    private JsonNode rawResponse;
    private LocalDateTime createdAt;

}
