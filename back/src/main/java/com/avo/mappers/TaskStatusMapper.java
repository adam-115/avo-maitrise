package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import com.avo.dtos.TaskStatusDTO;
import com.avo.entities.TaskStatus;

@Mapper(componentModel = "spring")
public interface TaskStatusMapper {

    TaskStatusMapper INSTANCE = Mappers.getMapper(TaskStatusMapper.class);

    @Mapping(source = "ordreAffichage", target = "ordre_affichage")
    TaskStatusDTO toDto(TaskStatus taskStatus);

    @Mapping(source = "ordre_affichage", target = "ordreAffichage")
    TaskStatus toEntity(TaskStatusDTO taskStatusDTO);
}
