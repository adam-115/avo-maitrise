package com.avo.entities;

import java.sql.Date;

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
public class PersonnePhysique extends ClientEntity {

    private String nom;
    private String prenom;
    private String nationalite;
    private String cin;
    @Column(name = "date_naissance")
    private Date dateNaissance;

}
