package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

import com.avo.dtos.ScreeningExecutionDTO;
import com.avo.entities.ScreeningExecution;

@Mapper(componentModel = "spring")
public interface ScreeningExecutionhMapper {

    ScreeningExecutionhMapper INSTANCE = Mappers.getMapper(ScreeningExecutionhMapper.class);

    @Mapping(source = "client", target = "clientEntityDTO")
    @Mapping(source = "ubo", target = "uboDTO")
    ScreeningExecutionDTO toDto(ScreeningExecution screeningExecution);

    @Mapping(source = "clientEntityDTO", target = "client")
    @Mapping(source = "uboDTO", target = "ubo")
    ScreeningExecution toEntity(ScreeningExecutionDTO screeningExecutionDTO);
}
