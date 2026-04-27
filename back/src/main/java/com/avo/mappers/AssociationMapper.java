package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

import com.avo.dtos.AssociationDTO;
import com.avo.entities.Association;

@Mapper(componentModel = "spring", uses = {DocumentMapper.class})
public interface AssociationMapper {

    AssociationMapper INSTANCE = Mappers.getMapper(AssociationMapper.class);

    AssociationDTO toDto(Association association);

    Association toEntity(AssociationDTO associationDTO);
}
