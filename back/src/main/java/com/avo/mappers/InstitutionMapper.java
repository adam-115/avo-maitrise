package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

import com.avo.dtos.InstitutionDTO;
import com.avo.entities.Institution;

@Mapper(componentModel = "spring", uses = {DocumentMapper.class})
public interface InstitutionMapper {

    InstitutionMapper INSTANCE = Mappers.getMapper(InstitutionMapper.class);

    InstitutionDTO toDto(Institution institution);

    Institution toEntity(InstitutionDTO institutionDTO);
}
