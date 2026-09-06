package com.avo.entities;

import java.time.LocalDateTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;

import com.fasterxml.jackson.databind.JsonNode;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "screening_matches")
public class ScreeningMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "screening_execution_id", nullable = true)
    private ScreeningExecution screeningExecution;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    @NotFound(action = NotFoundAction.IGNORE)
    private ClientEntity client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ubo_id", nullable = true)
    private UBO ubo ;

    private String yenteId;

    private Double score;

    private String targetName;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_response", columnDefinition = "json")
    private JsonNode rawResponse;

    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "match_reason", columnDefinition = "TEXT")
    private String matchReason;

    @jakarta.persistence.Enumerated(jakarta.persistence.EnumType.STRING)
    @Column(name = "status", nullable = false, columnDefinition = "VARCHAR(50)")
    private ScreeningMatchStatus status = ScreeningMatchStatus.PENDING;

    @Column(name = "reviewer_comment", columnDefinition = "TEXT")
    private String reviewerComment;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "reviewed_by")
    private String reviewedBy;

    @Column(name = "yente_last_update")
    private String yenteLastUpdate;

    @Column(name = "client_version_at_review")
    private Long clientVersionAtReview;

    public ScreeningMatch() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ScreeningExecution getScreeningExecution() { return screeningExecution; }
    public void setScreeningExecution(ScreeningExecution screeningExecution) { this.screeningExecution = screeningExecution; }

    public ClientEntity getClient() { return client; }
    public void setClient(ClientEntity client) { this.client = client; }

    public UBO getUbo() { return ubo; }
    public void setUbo(UBO ubo) { this.ubo = ubo; }

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

    public ScreeningMatchStatus getStatus() { return status; }
    public void setStatus(ScreeningMatchStatus status) { this.status = status; }

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
}
