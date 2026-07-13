package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import com.avo.entities.InvoiceStatusEnum;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceDTO {
    private Long id;
    private String numeroFacture;
    private InvoiceStatusEnum status;
    private LocalDate issueDate;
    private LocalDate dueDate;
    private List<InvoiceTimeEntryDTO> invoiceTimeEntries;
    private BigDecimal subtotalAmount;
    private BigDecimal taxRate;
    private BigDecimal totalAmount;
    private int dunningLevel;
    private boolean isDisputed;
    private DossierDTO dossier;
    private String note;
}
