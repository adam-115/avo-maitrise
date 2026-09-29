package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;
import com.avo.dtos.DossierPartieDTO;
import com.avo.entities.DossierPartie;

@Mapper(componentModel = "spring", uses = {ClientEntityMapper.class})
public interface DossierPartieMapper {
    DossierPartieMapper INSTANCE = Mappers.getMapper(DossierPartieMapper.class);

    DossierPartieDTO toDto(DossierPartie entity);
    DossierPartie toEntity(DossierPartieDTO dto);
}
