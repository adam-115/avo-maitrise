package com.avo.entities;

import java.util.Date;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "invoice_dossier_services")
@Data
@NoArgsConstructor
public class InvoiceDossierServie {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String detaille ;
    private Date creationDate = new Date();
    private int nbrOfMinutes ; 
    @OneToOne
    private Dossier dossier; 
    @OneToOne
    private InvoiceTypeOfService invoiceTypeOfService;
    @OneToOne
    private AppUser createdBy;
    @OneToOne
    private AppUser doneBy;
    

}
