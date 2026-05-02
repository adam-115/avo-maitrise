package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

import com.avo.dtos.ScreeningMatchDTO;
import com.avo.entities.ScreeningMatch;

@Mapper(componentModel = "spring")
public interface ScreeningMatchMapper {

    ScreeningMatchMapper INSTANCE = Mappers.getMapper(ScreeningMatchMapper.class);

    @Mapping(source = "client", target = "clientEntityDTO")
    @Mapping(source = "screeningExecution", target = "screeningExecutionDTO")
    ScreeningMatchDTO toDto(ScreeningMatch screeningMatch);

    @Mapping(source = "clientEntityDTO", target = "client")
    @Mapping(source = "uboDTO", target = "ubo")
    @Mapping(source = "screeningExecutionDTO", target = "screeningExecution")
    ScreeningMatch toEntity(ScreeningMatchDTO screeningMatchDTO);
}
