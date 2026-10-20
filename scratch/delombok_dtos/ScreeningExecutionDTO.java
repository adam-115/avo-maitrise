package com.avo.dtos;

import java.time.LocalDateTime;
import com.avo.entities.ScreeningExecutionStatus;
import com.fasterxml.jackson.databind.JsonNode;

public class ScreeningExecutionDTO {

    private Long id;
    private ClientEntityDTO clientEntityDTO;
    private UBODTO uboDTO;
    private JsonNode rawResponse;
    private LocalDateTime createdAt;
    private String executionMessage;
    private ScreeningExecutionStatus status;

    public ScreeningExecutionDTO() {}

    public ScreeningExecutionDTO(Long id, ClientEntityDTO clientEntityDTO, UBODTO uboDTO, JsonNode rawResponse, LocalDateTime createdAt, String executionMessage, ScreeningExecutionStatus status) {
        this.id = id;
        this.clientEntityDTO = clientEntityDTO;
        this.uboDTO = uboDTO;
        this.rawResponse = rawResponse;
        this.createdAt = createdAt;
        this.executionMessage = executionMessage;
        this.status = status;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ClientEntityDTO getClientEntityDTO() { return clientEntityDTO; }
    public void setClientEntityDTO(ClientEntityDTO clientEntityDTO) { this.clientEntityDTO = clientEntityDTO; }

    public UBODTO getUboDTO() { return uboDTO; }
    public void setUboDTO(UBODTO uboDTO) { this.uboDTO = uboDTO; }

    public JsonNode getRawResponse() { return rawResponse; }
    public void setRawResponse(JsonNode rawResponse) { this.rawResponse = rawResponse; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getExecutionMessage() { return executionMessage; }
    public void setExecutionMessage(String executionMessage) { this.executionMessage = executionMessage; }

    public ScreeningExecutionStatus getStatus() { return status; }
    public void setStatus(ScreeningExecutionStatus status) { this.status = status; }

    public static ScreeningExecutionDTOBuilder builder() {
        return new ScreeningExecutionDTOBuilder();
    }

    public static class ScreeningExecutionDTOBuilder {
        private Long id;
        private ClientEntityDTO clientEntityDTO;
        private UBODTO uboDTO;
        private JsonNode rawResponse;
        private LocalDateTime createdAt;
        private String executionMessage;
        private ScreeningExecutionStatus status;

        public ScreeningExecutionDTOBuilder id(Long id) { this.id = id; return this; }
        public ScreeningExecutionDTOBuilder clientEntityDTO(ClientEntityDTO clientEntityDTO) { this.clientEntityDTO = clientEntityDTO; return this; }
        public ScreeningExecutionDTOBuilder uboDTO(UBODTO uboDTO) { this.uboDTO = uboDTO; return this; }
        public ScreeningExecutionDTOBuilder rawResponse(JsonNode rawResponse) { this.rawResponse = rawResponse; return this; }
        public ScreeningExecutionDTOBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public ScreeningExecutionDTOBuilder executionMessage(String executionMessage) { this.executionMessage = executionMessage; return this; }
        public ScreeningExecutionDTOBuilder status(ScreeningExecutionStatus status) { this.status = status; return this; }

        public ScreeningExecutionDTO build() {
            return new ScreeningExecutionDTO(id, clientEntityDTO, uboDTO, rawResponse, createdAt, executionMessage, status);
        }
    }
}
