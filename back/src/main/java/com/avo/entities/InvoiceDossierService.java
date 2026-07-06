package com.avo.entities;

import java.util.Date;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "invoice_dossier_services")
@Data
@NoArgsConstructor
public class InvoiceDossierService {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String info;
    private Date creationDate = new Date();
    private int nbrOfMinutes;
    @ManyToOne
    private Dossier dossier;
    @ManyToOne
    private InvoiceTypeOfService invoiceTypeOfService;
    @ManyToOne
    private InvoiceDossierServieStatus invoiceDossierServieStatus;

    @OneToOne
    private AppUser createdBy;
    @OneToOne
    private AppUser doneBy;

}
