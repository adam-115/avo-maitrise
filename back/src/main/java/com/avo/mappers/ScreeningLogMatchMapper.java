package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

import com.avo.dtos.ScreeningLogMatchDTO;
import com.avo.entities.ScreeningLogMatch;

@Mapper(componentModel = "spring")
public interface ScreeningLogMatchMapper {

    ScreeningLogMatchMapper INSTANCE = Mappers.getMapper(ScreeningLogMatchMapper.class);

    @Mapping(source = "client.id", target = "clientId")
    ScreeningLogMatchDTO toDto(ScreeningLogMatch screeningLogMatch);

    @Mapping(source = "clientId", target = "client.id")
    ScreeningLogMatch toEntity(ScreeningLogMatchDTO screeningLogMatchDTO);
}
