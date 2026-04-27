package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

import com.avo.dtos.ClientEntityDTO;
import com.avo.entities.ClientEntity;

@Mapper(componentModel = "spring", uses = {DocumentMapper.class})
public interface ClientEntityMapper {

    ClientEntityMapper INSTANCE = Mappers.getMapper(ClientEntityMapper.class);

    ClientEntityDTO toDto(ClientEntity client);

    ClientEntity toEntity(ClientEntityDTO clientDTO);
}
