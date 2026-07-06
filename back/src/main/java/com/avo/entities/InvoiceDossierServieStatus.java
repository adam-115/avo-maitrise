package com.avo.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "invoice_dossier_service_status")
@Data
@NoArgsConstructor
public class InvoiceDossierServieStatus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String color;
    private String name;
    @Column(unique = true)
    private String code;
    private String description;
    private boolean active = true;
    @ManyToOne
    private AppUser createdByUser; 
}
