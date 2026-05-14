package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import com.avo.dtos.DossierPrioriteDTO;
import com.avo.entities.DossierPriorite;

@Mapper(componentModel = "spring")
public interface DossierPrioriteMapper {

    DossierPrioriteMapper INSTANCE = Mappers.getMapper(DossierPrioriteMapper.class);

    @Mapping(source = "displayOrder", target = "order")
    DossierPrioriteDTO toDto(DossierPriorite dossierPriorite);

    @Mapping(source = "order", target = "displayOrder")
    DossierPriorite toEntity(DossierPrioriteDTO dossierPrioriteDTO);
}
