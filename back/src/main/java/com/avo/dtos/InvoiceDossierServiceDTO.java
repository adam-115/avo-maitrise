package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;
import com.avo.entities.InvoiceDossierServiceStatusEnum;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceDossierServiceDTO {
    private Long id;
    private String info;
    private Date creationDate;
    private int nbrOfMinutes;
    private DossierDTO dossier;
    private InvoiceTypeOfServiceDTO invoiceTypeOfService;
    private InvoiceDossierServiceStatusEnum status;
    private UserDTO createdBy;
    private UserDTO doneBy;
}
