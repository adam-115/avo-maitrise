package com.avo.mappers;

import com.avo.dtos.InvoiceDossierServieStatusDTO;
import com.avo.entities.InvoiceDossierServieStatus;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = {UserMapper.class})
public interface InvoiceDossierServieStatusMapper {
    InvoiceDossierServieStatusDTO toDto(InvoiceDossierServieStatus entity);
    InvoiceDossierServieStatus toEntity(InvoiceDossierServieStatusDTO dto);
}
