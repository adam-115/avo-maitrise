package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import com.avo.dtos.NoteDTO;
import com.avo.entities.Note;

@Mapper(componentModel = "spring")
public interface NoteMapper {

    NoteMapper INSTANCE = Mappers.getMapper(NoteMapper.class);

    @Mapping(source = "category.id", target = "categoryId")
    @Mapping(source = "category.label", target = "categoryLabel")
    @Mapping(source = "category.color", target = "categoryColor")
    @Mapping(source = "dossier.id", target = "dossierId")
    @Mapping(source = "auteur.id", target = "auteurId")
    NoteDTO toDto(Note note);

    @Mapping(target = "category", ignore = true)
    @Mapping(target = "dossier", ignore = true)
    @Mapping(target = "auteur", ignore = true)
    Note toEntity(NoteDTO noteDTO);
}
