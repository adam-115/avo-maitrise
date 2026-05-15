package com.avo.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.Date;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "matter_events")
@Getter
@Setter
@NoArgsConstructor
public class MatterEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dossier_id", nullable = false)
    private Long dossierId;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_type_id")
    private EventType categorie;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false)
    private Date startDate;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false)
    private Date endDate;

    private boolean isAllDay;

    private String lieu;

    @ElementCollection
    @CollectionTable(name = "matter_event_participants", joinColumns = @JoinColumn(name = "event_id"))
    @Column(name = "participant_id")
    private List<String> participantsIds = new ArrayList<>();

    private Integer reminderMinutesBefore;

    @Column(nullable = false)
    private String statut; // CONFIRME, ANNULE, REPORTE, TERMINE

    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;

    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = new Date();
        updatedAt = new Date();
        if (statut == null) {
            statut = "CONFIRME";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = new Date();
    }
}
