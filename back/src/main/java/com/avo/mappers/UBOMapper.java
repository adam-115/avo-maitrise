package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

import com.avo.dtos.UBODTO;
import com.avo.entities.UBO;

@Mapper(componentModel = "spring")
public interface UBOMapper {

    UBOMapper INSTANCE = Mappers.getMapper(UBOMapper.class);

    @Mapping(source = "clientMoral.id", target = "clientMoralId")
    UBODTO toDto(UBO ubo);

    @Mapping(source = "clientMoralId", target = "clientMoral.id")
    UBO toEntity(UBODTO uboDTO);
}
