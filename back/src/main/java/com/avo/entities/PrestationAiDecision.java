package com.avo.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "prestation_ai_decisions")
@Getter
@Setter
@NoArgsConstructor
public class PrestationAiDecision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dossier_id", nullable = false)
    private Long dossierId;

    @Column(name = "source_key", nullable = false, length = 150)
    private String sourceKey;

    @Column(nullable = false, length = 20)
    private String decision; // ACCEPTED | REJECTED

    @Column(name = "suggested_info", length = 500)
    private String suggestedInfo;

    @Column(name = "created_prestation_id")
    private Long createdPrestationId;

    @Column(name = "decided_by", length = 120)
    private String decidedBy;

    @Column(name = "decided_at", nullable = false)
    private LocalDateTime decidedAt;

    @PrePersist
    protected void onCreate() {
        if (decidedAt == null) {
            decidedAt = LocalDateTime.now();
        }
    }
}
