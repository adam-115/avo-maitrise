package com.avo.mappers;

import com.avo.dtos.AiConfigurationDTO;
import com.avo.entities.AiConfiguration;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface AiConfigurationMapper {
    AiConfigurationMapper INSTANCE = Mappers.getMapper(AiConfigurationMapper.class);

    AiConfigurationDTO toDto(AiConfiguration entity);
    AiConfiguration toEntity(AiConfigurationDTO dto);
}
