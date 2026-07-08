package com.avo.entities;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import lombok.Data;

@Entity
@Data
public class InvoiceTimeEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Invoice invoice;

    @OneToOne
    InvoiceDossierService invoiceDossierService;

    @Column(nullable = false)
    private int nbrOfMinutes;

    @Column(nullable = false)
    private BigDecimal price5min;



}
