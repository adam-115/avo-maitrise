package com.avo.entities;

import java.math.BigDecimal;
import java.util.Date;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "invoice_types_of_service")
@Data
@NoArgsConstructor
public class InvoiceTypeOfService  {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    // private String title;
    @Column(nullable = false, unique = true)
    private String code;
    @Column(nullable = false)
    private String description;
    private boolean actif = true;
    // peer 5 min
    @Column(nullable = false)
    private BigDecimal price5min; 
    @Column(nullable = false)
    private Date creationDate = new Date();
    private Date updateDate = null ;

}
