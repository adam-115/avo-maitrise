package com.avo.entities;

import java.sql.Date;
import java.util.List;

import org.hibernate.annotations.ManyToAny;
import org.hibernate.mapping.OneToMany;
import org.w3c.dom.views.DocumentView;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "personnes_physiques")
@Getter
@Setter
@NoArgsConstructor
public class ClientPersonnePhysique extends ClientEntity {

    private String nom;
    private String prenom;
    private String nationalite;
    private String cin;
    @Column(name = "date_naissance")
    private Date dateNaissance;

    @jakarta.persistence.OneToMany(mappedBy = "DOcument")
    private List<Document>  documents ;
}
