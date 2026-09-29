package com.avo.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "dossier_parties")
public class DossierPartie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id", nullable = false)
    private Dossier dossier;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "client_id", nullable = false)
    private ClientEntity partie;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private RolePartie role;

    public DossierPartie() {}

    public DossierPartie(Dossier dossier, ClientEntity partie, RolePartie role) {
        this.dossier = dossier;
        this.partie = partie;
        this.role = role;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Dossier getDossier() {
        return dossier;
    }

    public void setDossier(Dossier dossier) {
        this.dossier = dossier;
    }

    public ClientEntity getPartie() {
        return partie;
    }

    public void setPartie(ClientEntity partie) {
        this.partie = partie;
    }

    public RolePartie getRole() {
        return role;
    }

    public void setRole(RolePartie role) {
        this.role = role;
    }
}
