package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.Date;

@Data
@AllArgsConstructor
@Builder
public class InvoiceTypeOfServiceDTO {
    public InvoiceTypeOfServiceDTO() {}

    public static class InvoiceTypeOfServiceDTOBuilder {
        public InvoiceTypeOfServiceDTOBuilder() {}
    }

    private Long id;
    private String code;
    private String description;
    private boolean actif;
    private BigDecimal price5min;
    private Date creationDate;
    private Date updateDate;
}
