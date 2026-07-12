package com.avo.mappers;

import com.avo.dtos.InvoiceDTO;
import com.avo.entities.Invoice;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = {
    InvoiceTimeEntryMapper.class,
    DossierMapper.class
})
public interface InvoiceMapper {
    InvoiceDTO toDto(Invoice entity);
    Invoice toEntity(InvoiceDTO dto);
}
