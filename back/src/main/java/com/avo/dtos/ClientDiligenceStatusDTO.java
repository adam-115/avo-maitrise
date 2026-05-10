package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientDiligenceStatusDTO {
    private String id;
    private Long clientId;
    private String formConfigId;
    private String status;
    private String resultId;
}
