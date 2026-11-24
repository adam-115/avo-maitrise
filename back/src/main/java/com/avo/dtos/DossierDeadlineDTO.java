package com.avo.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
public class DossierDeadlineDTO {
    private Long id;
    private Long dossierId;
    private String dossierReference;
    private String dossierTitre;
    private Long ruleId;
    private String pays;
    private String titre;
    private String categorie;
    private String triggerEventLabel;
    private LocalDate dateDepart;
    private LocalDate dateEcheanceCalculee;
    private LocalDate dateEcheanceFinale;
    private String detailCalcul;
    private String baseLegale;
    private String sourceUrl;
    private int delaiDistanceMois;
    private boolean alsaceMoselle;
    private int suspensionJours;
    private String statut;
    private String criticite;
    private String responsableId;
    private String suppleantId;
    private String validePar;
    private LocalDateTime valideLe;
    private String accompliPar;
    private LocalDateTime accompliLe;
    private String justificatifAccomplissement;
    private String motifModification;
    private Long matterEventId;
    private Long documentId;
    private String externalCalendarEventId;
    private String externalCalendarProvider;
    private long joursRestants;
    private boolean enRetard;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Champs optionnels utilisés pour la création/prévisualisation d'un délai personnalisé
    private Integer customDureeValeur;
    private String customDureeUnite;
    private Boolean customProrogeWeekendFerie;
    private Boolean customEstFranc;
    private Boolean syncAgenda;
    private List<String> etapesCalcul;
}
