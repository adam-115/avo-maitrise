package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import com.avo.dtos.AppointementDTO;
import com.avo.entities.Appointement;

@Mapper(componentModel = "spring")
public interface AppointementMapper {

    AppointementMapper INSTANCE = Mappers.getMapper(AppointementMapper.class);

    @Mapping(source = "client.id", target = "clientId")
    @Mapping(source = "dossier.id", target = "dossierId")
    AppointementDTO toDto(Appointement entity);

    @Mapping(target = "client", ignore = true)
    @Mapping(target = "dossier", ignore = true)
    Appointement toEntity(AppointementDTO dto);
}
