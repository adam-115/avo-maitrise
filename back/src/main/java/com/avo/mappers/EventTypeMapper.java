package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import com.avo.dtos.EventTypeDTO;
import com.avo.entities.EventType;

@Mapper(componentModel = "spring")
public interface EventTypeMapper {

    EventTypeMapper INSTANCE = Mappers.getMapper(EventTypeMapper.class);

    @Mapping(source = "displayOrder", target = "order")
    EventTypeDTO toDto(EventType eventType);

    @Mapping(source = "order", target = "displayOrder")
    EventType toEntity(EventTypeDTO eventTypeDTO);
}
