package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import com.avo.dtos.MatterEventDTO;
import com.avo.entities.MatterEvent;

@Mapper(componentModel = "spring", uses = {EventTypeMapper.class})
public interface MatterEventMapper {

    MatterEventMapper INSTANCE = Mappers.getMapper(MatterEventMapper.class);

    MatterEventDTO toDto(MatterEvent matterEvent);

    MatterEvent toEntity(MatterEventDTO matterEventDTO);
}
