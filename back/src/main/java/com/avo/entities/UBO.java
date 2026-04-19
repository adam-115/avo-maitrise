package com.avo.entities;

import java.util.Date;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "ubos")
@Getter
@Setter
@NoArgsConstructor
public class UBO {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "date_of_birth")
    @Temporal(TemporalType.DATE)
    private Date dateOfBirth;

    @Column(name = "nationality")
    private String nationality;

    @Column(name = "role_in_company")
    private String roleInCompany; // e.g., "Directeur Général", "Actionnaire majoritaire"

    @Column(name = "percentage_of_ownership")
    private Double percentageOfOwnership; // Pourcentage de détention

    @Column(name = "aml_analysis_status")
    private String amlAnalysisStatus; // TODO, OK, SUSPECT, BLOCKED

    @Column(name = "aml_match_score")
    private Double amlMatchScore;

    @Column(name = "aml_target_entity_name")
    private String amlTargetEntityName;

    @Column(name = "aml_sanction_reason")
    private String amlSanctionReason;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "aml_last_verification_date")
    private Date amlLastVerificationDate;

    @ManyToOne
    @JoinColumn(name = "client_id", nullable = false)
    private ClientMoral clientMoral;

}
