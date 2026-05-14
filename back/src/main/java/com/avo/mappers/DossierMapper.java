package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import com.avo.dtos.DossierDTO;
import com.avo.entities.Dossier;

@Mapper(componentModel = "spring", uses = {DocumentMapper.class})
public interface DossierMapper {

    DossierMapper INSTANCE = Mappers.getMapper(DossierMapper.class);

    @Mapping(source = "updatedAt", target = "updated_at")
    DossierDTO toDto(Dossier dossier);

    @Mapping(source = "updated_at", target = "updatedAt")
    Dossier toEntity(DossierDTO dossierDTO);
}
