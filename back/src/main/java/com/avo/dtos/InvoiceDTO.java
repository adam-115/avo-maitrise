package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import com.avo.entities.InvoiceStatusEnum;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceDTO {
    private Long id;

    @Size(max = 50, message = "Le numéro de facture ne doit pas dépasser 50 caractères")
    private String numeroFacture;

    private InvoiceStatusEnum status;

    @NotNull(message = "La date d'émission est obligatoire")
    private LocalDate issueDate;

    @NotNull(message = "La date d'échéance est obligatoire")
    private LocalDate dueDate;

    private List<InvoiceTimeEntryDTO> invoiceTimeEntries;

    @PositiveOrZero(message = "Le montant sous-total doit être supérieur ou égal à zéro")
    private BigDecimal subtotalAmount;

    @PositiveOrZero(message = "Le taux de taxe doit être positif ou nul")
    private BigDecimal taxRate;

    @PositiveOrZero(message = "Le montant total doit être supérieur ou égal à zéro")
    private BigDecimal totalAmount;

    private int dunningLevel;
    private boolean isDisputed;
    private DossierDTO dossier;

    @Size(max = 1000, message = "La note ne doit pas dépasser 1000 caractères")
    private String note;
}
