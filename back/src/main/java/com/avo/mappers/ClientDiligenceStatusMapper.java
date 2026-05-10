package com.avo.mappers;

import com.avo.dtos.ClientDiligenceStatusDTO;
import com.avo.entities.ClientDiligenceStatus;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface ClientDiligenceStatusMapper {
    @Mapping(target = "client.id", source = "clientId")
    @Mapping(target = "formConfig.id", source = "formConfigId")
    ClientDiligenceStatus toEntity(ClientDiligenceStatusDTO dto);

    @Mapping(target = "clientId", source = "client.id")
    @Mapping(target = "formConfigId", source = "formConfig.id")
    ClientDiligenceStatusDTO toDto(ClientDiligenceStatus entity);
}
