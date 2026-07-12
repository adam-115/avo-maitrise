package com.avo.mappers;

import com.avo.dtos.InvoiceTimeEntryDTO;
import com.avo.entities.InvoiceTimeEntry;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = {
    InvoiceDossierServiceMapper.class
})
public interface InvoiceTimeEntryMapper {
    InvoiceTimeEntryDTO toDto(InvoiceTimeEntry entity);
    InvoiceTimeEntry toEntity(InvoiceTimeEntryDTO dto);
}
