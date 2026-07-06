package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;
import com.avo.dtos.InvoiceTypeOfServiceDTO;
import com.avo.entities.InvoiceTypeOfService;

@Mapper(componentModel = "spring")
public interface InvoiceTypeOfServiceMapper {

    InvoiceTypeOfServiceMapper INSTANCE = Mappers.getMapper(InvoiceTypeOfServiceMapper.class);

    InvoiceTypeOfServiceDTO toDto(InvoiceTypeOfService invoiceTypeOfService);

    InvoiceTypeOfService toEntity(InvoiceTypeOfServiceDTO invoiceTypeOfServiceDTO);
}
