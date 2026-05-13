package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import com.avo.dtos.StatutDossierDTO;
import com.avo.entities.StatutDossier;

@Mapper(componentModel = "spring")
public interface StatutDossierMapper {

    StatutDossierMapper INSTANCE = Mappers.getMapper(StatutDossierMapper.class);

    @Mapping(source = "displayOrder", target = "order")
    StatutDossierDTO toDto(StatutDossier statutDossier);

    @Mapping(source = "order", target = "displayOrder")
    StatutDossier toEntity(StatutDossierDTO statutDossierDTO);
}
