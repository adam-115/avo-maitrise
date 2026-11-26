package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@AllArgsConstructor
@Builder
public class ClientDiligenceStatusDTO {
    public ClientDiligenceStatusDTO() {}

    public static class ClientDiligenceStatusDTOBuilder {
        public ClientDiligenceStatusDTOBuilder() {}
    }

    private String id;
    private Long clientId;
    private String formConfigId;
    private Long uboId;
    private String status;
    private String resultId;
    private OffsetDateTime creationDate;
    private OffsetDateTime lastUpdateDate;
    private boolean enabled;
    
    // UI Helpers
    private String clientName;
    private String uboName;
    private String formTitle;
    private String clientType;
}
