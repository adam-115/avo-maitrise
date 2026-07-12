package com.avo.mappers;

import org.mapstruct.Mapper;
import com.avo.dtos.CabinetProfileDTO;
import com.avo.entities.CabinetProfile;

@Mapper(componentModel = "spring")
public interface CabinetProfileMapper {
    CabinetProfile toEntity(CabinetProfileDTO dto);
    CabinetProfileDTO toDto(CabinetProfile entity);
}
