package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

import com.avo.dtos.SecteurActiviteDTO;
import com.avo.entities.SecteurActivite;

@Mapper(componentModel = "spring")
public interface SecteurActiviteMapper {

    SecteurActiviteMapper INSTANCE = Mappers.getMapper(SecteurActiviteMapper.class);

    SecteurActiviteDTO toDto(SecteurActivite secteurActivite);

    SecteurActivite toEntity(SecteurActiviteDTO secteurActiviteDTO);
}
