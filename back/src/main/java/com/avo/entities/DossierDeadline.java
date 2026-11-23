package com.avo.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Échéance / délai de procédure attaché à un dossier.
 * Entité historisée par Hibernate Envers (@Audited) pour la traçabilité et la protection
 * en responsabilité civile professionnelle (RCP) du cabinet.
 */
@Audited
@Entity
@Table(name = "dossier_deadlines")
@Getter
@Setter
@NoArgsConstructor
public class DossierDeadline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dossier_id", nullable = false)
    private Long dossierId;

    @Column(name = "rule_id")
    private Long ruleId;

    @Column(nullable = false, length = 30)
    private String pays;

    @Column(nullable = false)
    private String titre;

    @Column(nullable = false, length = 30)
    private String categorie;

    @Column(name = "trigger_event_label")
    private String triggerEventLabel;

    @Column(name = "date_depart", nullable = false)
    private LocalDate dateDepart;

    @Column(name = "date_echeance_calculee", nullable = false)
    private LocalDate dateEcheanceCalculee;

    @Column(name = "date_echeance_finale", nullable = false)
    private LocalDate dateEcheanceFinale;

    @Column(name = "detail_calcul", columnDefinition = "TEXT")
    private String detailCalcul;

    @Column(name = "base_legale")
    private String baseLegale;

    @Column(name = "source_url", length = 500)
    private String sourceUrl;

    @Column(name = "delai_distance_mois", nullable = false)
    private int delaiDistanceMois = 0;

    @Column(name = "alsace_moselle", nullable = false)
    private boolean alsaceMoselle = false;

    @Column(name = "suspension_jours", nullable = false)
    private int suspensionJours = 0;

    @Column(nullable = false, length = 30)
    private String statut = "ACTIF"; // ACTIF, ACCOMPLI, INTERROMPU, SUSPENDU, EXPIRE, ANNULE

    @Column(nullable = false, length = 20)
    private String criticite = "CRITIQUE"; // CRITIQUE, HAUTE, NORMALE

    @Column(name = "responsable_id", length = 50)
    private String responsableId;

    @Column(name = "suppleant_id", length = 50)
    private String suppleantId;

    @Column(name = "valide_par", length = 120)
    private String validePar;

    @Column(name = "valide_le")
    private LocalDateTime valideLe;

    @Column(name = "accompli_par", length = 120)
    private String accompliPar;

    @Column(name = "accompli_le")
    private LocalDateTime accompliLe;

    @Column(name = "justificatif_accomplissement", columnDefinition = "TEXT")
    private String justificatifAccomplissement;

    @Column(name = "motif_modification", columnDefinition = "TEXT")
    private String motifModification;

    @Column(name = "matter_event_id")
    private Long matterEventId;

    @Column(name = "document_id")
    private Long documentId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
        if (statut == null) statut = "ACTIF";
        if (criticite == null) criticite = "CRITIQUE";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
