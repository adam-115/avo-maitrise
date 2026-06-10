package com.avo.entities;

import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import jakarta.persistence.PrePersist;
import java.util.Date;

@Entity
@Table(name = "clients")
@Inheritance(strategy = InheritanceType.JOINED)
public class ClientEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    private String telephone;

    private String adresse;

    private String pays;

    @jakarta.persistence.Enumerated(jakarta.persistence.EnumType.STRING)
    @Column(name = "client_status", columnDefinition = "VARCHAR(50)")
    private ClientStatus clientStatus = ClientStatus.AML_REQUIRED;

    @Column(name = "secteur_activite")
    private String secteurActivite;

    @OneToMany(mappedBy = "client", cascade = {CascadeType.PERSIST, CascadeType.MERGE, CascadeType.REMOVE}, orphanRemoval = true)
    private List<Document> documents;

    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ContactPoint> contacts;

    @OneToMany(mappedBy ="client" , cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScreeningMatch> screeningMatchs ;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", nullable = false, updatable = false)
    private Date createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = new Date();
        }
    }

    public ClientEntity() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getTelephone() { return telephone; }
    public void setTelephone(String telephone) { this.telephone = telephone; }

    public String getAdresse() { return adresse; }
    public void setAdresse(String adresse) { this.adresse = adresse; }

    public String getPays() { return pays; }
    public void setPays(String pays) { this.pays = pays; }

    public ClientStatus getClientStatus() { return clientStatus; }
    public void setClientStatus(ClientStatus clientStatus) { this.clientStatus = clientStatus; }

    public String getSecteurActivite() { return secteurActivite; }
    public void setSecteurActivite(String secteurActivite) { this.secteurActivite = secteurActivite; }

    public List<Document> getDocuments() { return documents; }
    public void setDocuments(List<Document> documents) { this.documents = documents; }

    public List<ContactPoint> getContacts() { return contacts; }
    public void setContacts(List<ContactPoint> contacts) { this.contacts = contacts; }

    public List<ScreeningMatch> getScreeningMatchs() { return screeningMatchs; }
    public void setScreeningMatchs(List<ScreeningMatch> screeningMatchs) { this.screeningMatchs = screeningMatchs; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public String getType() {
        if (this instanceof ClientPersonnePhysique) return "PERSONNE";
        if (this instanceof ClientMoral) return "SOCIETE";
        if (this instanceof Association) return "ASSOCIATION";
        if (this instanceof Institution) return "INSTITUTION";
        return null;
    }

    public void linkChildren() {
        if (documents != null) {
            documents.forEach(d -> {
                d.setClient(this);
                if (this.id == null) {
                    d.setId(null);
                }
            });
        }
        if (contacts != null) {
            contacts.forEach(c -> {
                c.setClient(this);
                if (this.id == null) {
                    c.setId(null);
                }
            });
        }
    }
}
