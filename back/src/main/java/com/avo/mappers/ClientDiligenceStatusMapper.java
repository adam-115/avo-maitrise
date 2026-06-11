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
    @Mapping(target = "formTitle", source = "formConfig.title")
    @Mapping(target = "clientType", expression = "java(entity.getClient() != null ? entity.getClient().getType() : null)")
    @Mapping(target = "clientName", expression = "java(entity.getClient() != null ? entity.getClient().getDisplayName() : null)")
    ClientDiligenceStatusDTO toDto(ClientDiligenceStatus entity);
}
