package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

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
    private OffsetDateTime creationDate;
    private OffsetDateTime lastUpdateDate;
    private boolean enabled;
    
    // UI Helpers
    private String clientName;
    private String formTitle;
    private String clientType;
}
