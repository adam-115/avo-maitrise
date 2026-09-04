package com.avo.entities;

import jakarta.persistence.*;
import java.util.Date;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "dossiers")
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

    @ManyToOne(fetch = jakarta.persistence.FetchType.EAGER)
    @JoinColumn(name = "client_id")
    private ClientEntity client;

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

    public Dossier() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getReferenceInterne() { return referenceInterne; }
    public void setReferenceInterne(String referenceInterne) { this.referenceInterne = referenceInterne; }

    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public ClientEntity getClient() { return client; }
    public void setClient(ClientEntity client) { this.client = client; }

    public String getResponsableId() { return responsableId; }
    public void setResponsableId(String responsableId) { this.responsableId = responsableId; }

    public List<String> getIntervenantsIds() { return intervenantsIds; }
    public void setIntervenantsIds(List<String> intervenantsIds) { this.intervenantsIds = intervenantsIds; }

    public String getDomaineJuridique() { return domaineJuridique; }
    public void setDomaineJuridique(String domaineJuridique) { this.domaineJuridique = domaineJuridique; }

    public String getPrioriteID() { return prioriteID; }
    public void setPrioriteID(String prioriteID) { this.prioriteID = prioriteID; }

    public String getStatutID() { return statutID; }
    public void setStatutID(String statutID) { this.statutID = statutID; }

    public List<Document> getDocuments() { return documents; }
    public void setDocuments(List<Document> documents) { this.documents = documents; }

    public Date getDateOuverture() { return dateOuverture; }
    public void setDateOuverture(Date dateOuverture) { this.dateOuverture = dateOuverture; }

    public Date getDateCloture() { return dateCloture; }
    public void setDateCloture(Date dateCloture) { this.dateCloture = dateCloture; }

    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }

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
