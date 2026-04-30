package com.avo.entities;

import java.util.Date;
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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "clients")
@Inheritance(strategy = InheritanceType.JOINED) // Sépare les tables pour chaque type
@Getter
@Setter
@NoArgsConstructor
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
    //AMl required as default Value
    private ClientStatus clientStatus = ClientStatus.AML_REQUIRED;

    @Column(name = "aml_match_score")
    private Double amlMatchScore;



    @Column(name = "aml_sanction_reason")
    private String amlSanctionReason;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "aml_last_verification_date")
    private Date amlLastVerificationDate;

    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL)
    private List<Document> documents;

    @OneToMany(mappedBy = "client", cascade = CascadeType.PERSIST)
    private List<ContactPoint> contacts;

    @OneToMany(mappedBy ="client" , cascade = CascadeType.PERSIST)
    private List<ScreeningMatch> screeningMatchs ;

    public String getType() {
        if (this instanceof ClientPersonnePhysique) return "PERSONNE";
        if (this instanceof ClientMoral) return "SOCIETE";
        if (this instanceof Association) return "ASSOCIATION";
        if (this instanceof Institution) return "INSTITUTION";
        return null;
    }

    public void linkChildren() {
        if (documents != null) {
            documents.forEach(d -> d.setClient(this));
        }
        if (contacts != null) {
            contacts.forEach(c -> c.setClient(this));
        }
    }
}
