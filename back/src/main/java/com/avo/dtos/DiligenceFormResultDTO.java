package com.avo.dtos;

import java.time.OffsetDateTime;
import java.util.List;

public class DiligenceFormResultDTO {
    private String id;
    private String formConfigId;
    private Long clientId;
    private OffsetDateTime creationDate;
    private OffsetDateTime lastUpdateDate;
    private List<FieldResultDTO> fieldResults;

    public DiligenceFormResultDTO() {}

    public DiligenceFormResultDTO(String id, String formConfigId, Long clientId, OffsetDateTime creationDate, OffsetDateTime lastUpdateDate, List<FieldResultDTO> fieldResults) {
        this.id = id;
        this.formConfigId = formConfigId;
        this.clientId = clientId;
        this.creationDate = creationDate;
        this.lastUpdateDate = lastUpdateDate;
        this.fieldResults = fieldResults;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFormConfigId() { return formConfigId; }
    public void setFormConfigId(String formConfigId) { this.formConfigId = formConfigId; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public OffsetDateTime getCreationDate() { return creationDate; }
    public void setCreationDate(OffsetDateTime creationDate) { this.creationDate = creationDate; }

    public OffsetDateTime getLastUpdateDate() { return lastUpdateDate; }
    public void setLastUpdateDate(OffsetDateTime lastUpdateDate) { this.lastUpdateDate = lastUpdateDate; }

    public List<FieldResultDTO> getFieldResults() { return fieldResults; }
    public void setFieldResults(List<FieldResultDTO> fieldResults) { this.fieldResults = fieldResults; }

    public static DiligenceFormResultDTOBuilder builder() {
        return new DiligenceFormResultDTOBuilder();
    }

    public static class DiligenceFormResultDTOBuilder {
        private String id;
        private String formConfigId;
        private Long clientId;
        private OffsetDateTime creationDate;
        private OffsetDateTime lastUpdateDate;
        private List<FieldResultDTO> fieldResults;

        public DiligenceFormResultDTOBuilder id(String id) { this.id = id; return this; }
        public DiligenceFormResultDTOBuilder formConfigId(String formConfigId) { this.formConfigId = formConfigId; return this; }
        public DiligenceFormResultDTOBuilder clientId(Long clientId) { this.clientId = clientId; return this; }
        public DiligenceFormResultDTOBuilder creationDate(OffsetDateTime creationDate) { this.creationDate = creationDate; return this; }
        public DiligenceFormResultDTOBuilder lastUpdateDate(OffsetDateTime lastUpdateDate) { this.lastUpdateDate = lastUpdateDate; return this; }
        public DiligenceFormResultDTOBuilder fieldResults(List<FieldResultDTO> fieldResults) { this.fieldResults = fieldResults; return this; }

        public DiligenceFormResultDTO build() {
            return new DiligenceFormResultDTO(id, formConfigId, clientId, creationDate, lastUpdateDate, fieldResults);
        }
    }
}
