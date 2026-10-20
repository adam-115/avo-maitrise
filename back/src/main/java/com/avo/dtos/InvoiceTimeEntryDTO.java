package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
@Builder
public class InvoiceTimeEntryDTO {
    public InvoiceTimeEntryDTO() {}

    public static class InvoiceTimeEntryDTOBuilder {
        public InvoiceTimeEntryDTOBuilder() {}
    }

    private Long id;
    private InvoiceDossierServiceDTO invoiceDossierService;
    private int nbrOfMinutes;
    private BigDecimal price5min;
}
