package com.avo.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Trace chaque alerte RCP envoyée pour un délai (J-30, J-15, J-7, J-3, J-1, J0)
 * afin d'éviter les envois en double et de conserver la preuve d'alerte.
 */
@Entity
@Table(name = "deadline_alert_logs",
        uniqueConstraints = @UniqueConstraint(name = "uq_deadline_alert_stage", columnNames = {"deadline_id", "alert_stage"}))
@Getter
@Setter
@NoArgsConstructor
public class DeadlineAlertLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "deadline_id", nullable = false)
    private Long deadlineId;

    @Column(name = "alert_stage", nullable = false, length = 20)
    private String alertStage; // J-30, J-15, J-7, J-3, J-1, J0, EXPIRE

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt = LocalDateTime.now();

    @Column(length = 500)
    private String recipients;

    @Column(length = 30)
    private String channel; // IN_APP, EMAIL, IN_APP+EMAIL

    public DeadlineAlertLog(Long deadlineId, String alertStage, String recipients, String channel) {
        this.deadlineId = deadlineId;
        this.alertStage = alertStage;
        this.sentAt = LocalDateTime.now();
        this.recipients = recipients;
        this.channel = channel;
    }
}
