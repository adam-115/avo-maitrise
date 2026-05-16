package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import com.avo.dtos.DossierContactDTO;
import com.avo.entities.DossierContact;

@Mapper(componentModel = "spring")
public interface DossierContactMapper {

    DossierContactMapper INSTANCE = Mappers.getMapper(DossierContactMapper.class);

    @Mapping(source = "dossier.id", target = "dossierId")
    DossierContactDTO toDto(DossierContact entity);

    @Mapping(source = "dossierId", target = "dossier.id")
    DossierContact toEntity(DossierContactDTO dto);
}
