package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

import com.avo.dtos.DocumentDTO;
import com.avo.entities.Document;

@Mapper(componentModel = "spring")
public interface DocumentMapper {

    DocumentMapper INSTANCE = Mappers.getMapper(DocumentMapper.class);

    @Mapping(source = "client.id", target = "clientId")
    DocumentDTO toDto(Document document);

    @Mapping(source = "clientId", target = "client.id")
    Document toEntity(DocumentDTO documentDTO);
}
