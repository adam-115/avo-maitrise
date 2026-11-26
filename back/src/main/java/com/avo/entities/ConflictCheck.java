package com.avo.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Trace déontologique horodatée d'un contrôle de conflits d'intérêts
 * (effectué avant/lors de la création d'un dossier, ou lors d'un re-contrôle).
 */
@Entity
@Table(name = "conflict_checks")
@Getter
@Setter
@NoArgsConstructor
public class ConflictCheck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dossier_id")
    private Long dossierId;

    @Column(name = "checked_by", nullable = false, length = 120)
    private String checkedBy;

    @Column(name = "checked_at", nullable = false)
    private LocalDateTime checkedAt;

    @Column(name = "search_summary", length = 1000)
    private String searchSummary;

    /** NONE, MEDIUM, HIGH, CRITICAL */
    @Column(name = "risk_level", nullable = false, length = 20)
    private String riskLevel = "NONE";

    @Column(name = "matches_count", nullable = false)
    private int matchesCount = 0;

    @Column(name = "matches_json", columnDefinition = "LONGTEXT")
    private String matchesJson;

    /** CLEARED, PROCEEDED_WITH_WAIVER, BLOCKED, SEARCH_ONLY */
    @Column(name = "decision", nullable = false, length = 30)
    private String decision = "CLEARED";

    @Column(name = "justification", columnDefinition = "TEXT")
    private String justification;

    @PrePersist
    protected void onCreate() {
        if (checkedAt == null) checkedAt = LocalDateTime.now();
    }
}
