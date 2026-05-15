package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;
import com.avo.dtos.TaskLogDTO;
import com.avo.entities.TaskLog;

@Mapper(componentModel = "spring")
public interface TaskLogMapper {

    TaskLogMapper INSTANCE = Mappers.getMapper(TaskLogMapper.class);

    TaskLogDTO toDto(TaskLog taskLog);

    TaskLog toEntity(TaskLogDTO taskLogDTO);
}
