package com.avo.dtos;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.util.Date;
import com.avo.entities.InvoiceDossierServiceStatusEnum;

@Data
@Builder
public class InvoiceDossierServiceDTO {
    public InvoiceDossierServiceDTO() {}

    public InvoiceDossierServiceDTO(Long id, String info, Date creationDate, LocalDate serviceDate, int nbrOfMinutes,
                                    DossierDTO dossier, InvoiceTypeOfServiceDTO invoiceTypeOfService,
                                    InvoiceDossierServiceStatusEnum status, UserDTO createdBy, UserDTO doneBy) {
        this.id = id;
        this.info = info;
        this.creationDate = creationDate;
        this.serviceDate = serviceDate;
        this.nbrOfMinutes = nbrOfMinutes;
        this.dossier = dossier;
        this.invoiceTypeOfService = invoiceTypeOfService;
        this.status = status;
        this.createdBy = createdBy;
        this.doneBy = doneBy;
    }

    public static class InvoiceDossierServiceDTOBuilder {
        public InvoiceDossierServiceDTOBuilder() {}
    }

    private Long id;
    private String info;
    private Date creationDate;
    private LocalDate serviceDate;
    private int nbrOfMinutes;
    private DossierDTO dossier;
    private InvoiceTypeOfServiceDTO invoiceTypeOfService;
    private InvoiceDossierServiceStatusEnum status;
    private UserDTO createdBy;
    private UserDTO doneBy;
}
