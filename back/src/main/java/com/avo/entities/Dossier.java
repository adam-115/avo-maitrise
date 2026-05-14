package com.avo.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.Date;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "dossiers")
@Getter
@Setter
@NoArgsConstructor
public class Dossier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String referenceInterne;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "client_id")
    private Long clientId;

    @Column(name = "responsable_id")
    private String responsableId;

    @ElementCollection
    @CollectionTable(name = "dossier_intervenants", joinColumns = @JoinColumn(name = "dossier_id"))
    @Column(name = "intervenant_id")
    private List<String> intervenantsIds = new ArrayList<>();

    private String domaineJuridique;
    
    @Column(name = "priorite_id")
    private String prioriteID;
    
    @Column(name = "statut_id")
    private String statutID;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinTable(
        name = "dossier_documents",
        joinColumns = @JoinColumn(name = "dossier_id"),
        inverseJoinColumns = @JoinColumn(name = "document_id")
    )
    private List<Document> documents = new ArrayList<>();

    @Temporal(TemporalType.TIMESTAMP)
    private Date dateOuverture;

    @Temporal(TemporalType.TIMESTAMP)
    private Date dateCloture;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_at")
    private Date updatedAt;

    private Double budgetEstime;
    private Double tauxHoraireApplique;

    private String methodeFacturation;

    @PrePersist
    protected void onCreate() {
        if (dateOuverture == null) {
            dateOuverture = new Date();
        }
        updatedAt = new Date();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = new Date();
    }
}
