package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceTimeEntryDTO {
    private Long id;
    private InvoiceDossierServiceDTO invoiceDossierService;
    private int nbrOfMinutes;
    private BigDecimal price5min;
}
