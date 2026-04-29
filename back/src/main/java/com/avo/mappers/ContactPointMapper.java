package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

import com.avo.dtos.ContactPointDTO;
import com.avo.entities.ContactPoint;

@Mapper(componentModel = "spring")
public interface ContactPointMapper {

    ContactPointMapper INSTANCE = Mappers.getMapper(ContactPointMapper.class);

    ContactPointDTO toDto(ContactPoint contactPoint);

    @Mapping(target = "client", ignore = true)
    ContactPoint toEntity(ContactPointDTO contactPointDTO);
}
