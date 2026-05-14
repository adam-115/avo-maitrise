package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import com.avo.dtos.NoteCategoryDTO;
import com.avo.entities.NoteCategory;

@Mapper(componentModel = "spring")
public interface NoteCategoryMapper {

    NoteCategoryMapper INSTANCE = Mappers.getMapper(NoteCategoryMapper.class);

    @Mapping(source = "displayOrder", target = "order")
    NoteCategoryDTO toDto(NoteCategory noteCategory);

    @Mapping(source = "order", target = "displayOrder")
    NoteCategory toEntity(NoteCategoryDTO noteCategoryDTO);
}
