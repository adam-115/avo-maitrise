package com.avo.dtos;

import java.time.LocalDateTime;
import com.fasterxml.jackson.databind.JsonNode;

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
    private String status;
    private String reviewerComment;
    private LocalDateTime reviewedAt;
    private String reviewedBy;
    private String yenteLastUpdate;
    private Long clientVersionAtReview;

    public ScreeningMatchDTO() {}

    public ScreeningMatchDTO(Long id, ClientEntityDTO clientEntityDTO, UBODTO uboDTO, ScreeningExecutionDTO screeningExecutionDTO, String yenteId, Double score, String targetName, JsonNode rawResponse, LocalDateTime createdAt, String matchReason, String status, String reviewerComment, LocalDateTime reviewedAt, String reviewedBy, String yenteLastUpdate, Long clientVersionAtReview) {
        this.id = id;
        this.clientEntityDTO = clientEntityDTO;
        this.uboDTO = uboDTO;
        this.screeningExecutionDTO = screeningExecutionDTO;
        this.yenteId = yenteId;
        this.score = score;
        this.targetName = targetName;
        this.rawResponse = rawResponse;
        this.createdAt = createdAt;
        this.matchReason = matchReason;
        this.status = status;
        this.reviewerComment = reviewerComment;
        this.reviewedAt = reviewedAt;
        this.reviewedBy = reviewedBy;
        this.yenteLastUpdate = yenteLastUpdate;
        this.clientVersionAtReview = clientVersionAtReview;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ClientEntityDTO getClientEntityDTO() { return clientEntityDTO; }
    public void setClientEntityDTO(ClientEntityDTO clientEntityDTO) { this.clientEntityDTO = clientEntityDTO; }

    public UBODTO getUboDTO() { return uboDTO; }
    public void setUboDTO(UBODTO uboDTO) { this.uboDTO = uboDTO; }

    public ScreeningExecutionDTO getScreeningExecutionDTO() { return screeningExecutionDTO; }
    public void setScreeningExecutionDTO(ScreeningExecutionDTO screeningExecutionDTO) { this.screeningExecutionDTO = screeningExecutionDTO; }

    public String getYenteId() { return yenteId; }
    public void setYenteId(String yenteId) { this.yenteId = yenteId; }

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }

    public String getTargetName() { return targetName; }
    public void setTargetName(String targetName) { this.targetName = targetName; }

    public JsonNode getRawResponse() { return rawResponse; }
    public void setRawResponse(JsonNode rawResponse) { this.rawResponse = rawResponse; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getMatchReason() { return matchReason; }
    public void setMatchReason(String matchReason) { this.matchReason = matchReason; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getReviewerComment() { return reviewerComment; }
    public void setReviewerComment(String reviewerComment) { this.reviewerComment = reviewerComment; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }

    public String getYenteLastUpdate() { return yenteLastUpdate; }
    public void setYenteLastUpdate(String yenteLastUpdate) { this.yenteLastUpdate = yenteLastUpdate; }

    public Long getClientVersionAtReview() { return clientVersionAtReview; }
    public void setClientVersionAtReview(Long clientVersionAtReview) { this.clientVersionAtReview = clientVersionAtReview; }

    public static ScreeningMatchDTOBuilder builder() {
        return new ScreeningMatchDTOBuilder();
    }

    public static class ScreeningMatchDTOBuilder {
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
        private String status;
        private String reviewerComment;
        private LocalDateTime reviewedAt;
        private String reviewedBy;
        private String yenteLastUpdate;
        private Long clientVersionAtReview;

        public ScreeningMatchDTOBuilder id(Long id) { this.id = id; return this; }
        public ScreeningMatchDTOBuilder clientEntityDTO(ClientEntityDTO clientEntityDTO) { this.clientEntityDTO = clientEntityDTO; return this; }
        public ScreeningMatchDTOBuilder uboDTO(UBODTO uboDTO) { this.uboDTO = uboDTO; return this; }
        public ScreeningMatchDTOBuilder screeningExecutionDTO(ScreeningExecutionDTO screeningExecutionDTO) { this.screeningExecutionDTO = screeningExecutionDTO; return this; }
        public ScreeningMatchDTOBuilder yenteId(String yenteId) { this.yenteId = yenteId; return this; }
        public ScreeningMatchDTOBuilder score(Double score) { this.score = score; return this; }
        public ScreeningMatchDTOBuilder targetName(String targetName) { this.targetName = targetName; return this; }
        public ScreeningMatchDTOBuilder rawResponse(JsonNode rawResponse) { this.rawResponse = rawResponse; return this; }
        public ScreeningMatchDTOBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public ScreeningMatchDTOBuilder matchReason(String matchReason) { this.matchReason = matchReason; return this; }
        public ScreeningMatchDTOBuilder status(String status) { this.status = status; return this; }
        public ScreeningMatchDTOBuilder reviewerComment(String reviewerComment) { this.reviewerComment = reviewerComment; return this; }
        public ScreeningMatchDTOBuilder reviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; return this; }
        public ScreeningMatchDTOBuilder reviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; return this; }
        public ScreeningMatchDTOBuilder yenteLastUpdate(String yenteLastUpdate) { this.yenteLastUpdate = yenteLastUpdate; return this; }
        public ScreeningMatchDTOBuilder clientVersionAtReview(Long clientVersionAtReview) { this.clientVersionAtReview = clientVersionAtReview; return this; }

        public ScreeningMatchDTO build() {
            return new ScreeningMatchDTO(id, clientEntityDTO, uboDTO, screeningExecutionDTO, yenteId, score, targetName, rawResponse, createdAt, matchReason, status, reviewerComment, reviewedAt, reviewedBy, yenteLastUpdate, clientVersionAtReview);
        }
    }
}
