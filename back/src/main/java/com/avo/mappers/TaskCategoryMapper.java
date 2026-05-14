package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;
import com.avo.dtos.TaskCategoryDTO;
import com.avo.entities.TaskCategory;

@Mapper(componentModel = "spring")
public interface TaskCategoryMapper {

    TaskCategoryMapper INSTANCE = Mappers.getMapper(TaskCategoryMapper.class);

    TaskCategoryDTO toDto(TaskCategory taskCategory);

    TaskCategory toEntity(TaskCategoryDTO taskCategoryDTO);
}
