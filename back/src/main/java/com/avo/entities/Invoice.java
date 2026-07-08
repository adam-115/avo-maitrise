package com.avo.entities;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import lombok.Data;

@Entity
@Data
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String numeroFacture;
    @Column(name = "status", nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private InvoiceStatusEnum status = InvoiceStatusEnum.DRAFT;
    @Column(name = "issue_date")
    private LocalDate issueDate;
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @OneToMany(mappedBy = "invoice")
    private List<InvoiceTimeEntry> invoiceTimeEntries;

    // Précision standard pour les devises (ex: 18 chiffres dont 2 après la virgule)
    @Column(name = "subtotal_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal subtotalAmount = BigDecimal.ZERO;

    @Column(name = "tax_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    // Indicateurs pour le processus de relance et de litige
    @Column(name = "dunning_level", nullable = false)
    private int dunningLevel = 0;

    @Column(name = "is_disputed", nullable = false)
    private boolean isDisputed = false;

    @ManyToOne
    @JoinColumn(name = "dossier_id")
    private Dossier dossier;

    @Column(name = "note", length = 500)
    private String note;

}
