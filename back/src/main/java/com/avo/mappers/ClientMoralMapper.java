package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

import com.avo.dtos.ClientMoralDTO;
import com.avo.entities.ClientMoral;

@Mapper(componentModel = "spring", uses = {DocumentMapper.class, UBOMapper.class})
public interface ClientMoralMapper {

    ClientMoralMapper INSTANCE = Mappers.getMapper(ClientMoralMapper.class);

    ClientMoralDTO toDto(ClientMoral clientMoral);

    ClientMoral toEntity(ClientMoralDTO clientMoralDTO);
}
