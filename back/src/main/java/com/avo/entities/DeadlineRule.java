package com.avo.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Règle légale référentielle pour le calcul déterministe des délais de procédure
 * (appel, prescription, péremption, pourvoi, conclusions...) par pays et domaine juridique.
 */
@Entity
@Table(name = "deadline_rules")
@Getter
@Setter
@NoArgsConstructor
public class DeadlineRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String code;

    @Column(nullable = false, length = 30)
    private String pays;

    @Column(name = "domaine_code", nullable = false, length = 30)
    private String domaineCode = "ALL";

    @Column(nullable = false, length = 30)
    private String categorie; // APPEL, PRESCRIPTION, PEREMPTION, POURVOI, CONCLUSIONS, RECOURS, AUTRE

    @Column(nullable = false)
    private String libelle;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "duree_valeur", nullable = false)
    private int dureeValeur;

    @Column(name = "duree_unite", nullable = false, length = 20)
    private String dureeUnite; // DAYS, MONTHS, YEARS

    @Column(name = "computation_mode", nullable = false, length = 30)
    private String computationMode = "FR_CPC_640_642"; // FR_CPC_640_642, PRESCRIPTION_STRICT

    @Column(name = "proroge_weekend_ferie", nullable = false)
    private boolean prorogeWeekendFerie = true;

    @Column(name = "est_franc", nullable = false)
    private boolean estFranc = false;

    @Column(name = "criticite_defaut", nullable = false, length = 20)
    private String criticiteDefaut = "CRITIQUE";

    @Column(name = "base_legale")
    private String baseLegale;

    @Column(name = "source_url", length = 500)
    private String sourceUrl;

    @Column(nullable = false)
    private boolean active = true;
}
