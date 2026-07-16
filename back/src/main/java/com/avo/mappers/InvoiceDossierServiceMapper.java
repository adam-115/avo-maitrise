package com.avo.mappers;

import com.avo.dtos.InvoiceDossierServiceDTO;
import com.avo.entities.InvoiceDossierService;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = {
    DossierMapper.class, 
    InvoiceTypeOfServiceMapper.class, 
    UserMapper.class
})
public interface InvoiceDossierServiceMapper {
    InvoiceDossierServiceDTO toDto(InvoiceDossierService entity);
    InvoiceDossierService toEntity(InvoiceDossierServiceDTO dto);
}
