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
    ScreeningMatchDTO toDto(ScreeningMatch screeningMatch);

    @Mapping(source = "uboDTO", target = "ubo")
    ScreeningMatch toEntity(ScreeningMatchDTO screeningMatchDTO);
}
