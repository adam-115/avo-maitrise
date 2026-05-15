package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import com.avo.dtos.TaskDTO;
import com.avo.entities.Task;

@Mapper(componentModel = "spring", uses = {TaskCategoryMapper.class, TaskStatusMapper.class, UserMapper.class})
public interface TaskMapper {

    TaskMapper INSTANCE = Mappers.getMapper(TaskMapper.class);

    TaskDTO toDto(Task task);

    Task toEntity(TaskDTO taskDTO);
}
