package com.avo.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.Date;

@Entity
@Table(name = "dossier_contacts")
@Getter
@Setter
@NoArgsConstructor
public class DossierContact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id", nullable = false)
    private Dossier dossier;

    private String civilite;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    private String entreprise;

    @Column(nullable = false)
    private String email;

    @Column(name = "telephone_fixe")
    private String telephoneFixe;

    @Column(name = "telephone_mobile")
    private String telephoneMobile;

    private String adresse;

    @Column(name = "num_toque")
    private String numToque;

    @Column(name = "site_web")
    private String siteWeb;

    private String pays;

    private String profession;

    @Column(columnDefinition = "TEXT")
    private String observation;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at")
    private Date createdAt;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_at")
    private Date updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = new Date();
        updatedAt = new Date();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = new Date();
    }
}
