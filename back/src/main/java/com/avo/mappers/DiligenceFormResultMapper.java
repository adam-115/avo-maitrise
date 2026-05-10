package com.avo.mappers;

import com.avo.dtos.DiligenceFormResultDTO;
import com.avo.dtos.FieldResultDTO;
import com.avo.entities.DiligenceFormResult;
import com.avo.entities.FieldResult;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface DiligenceFormResultMapper {
    @Mapping(target = "client.id", source = "clientId")
    @Mapping(target = "formConfig.id", source = "formConfigId")
    DiligenceFormResult toEntity(DiligenceFormResultDTO dto);

    @Mapping(target = "clientId", source = "client.id")
    @Mapping(target = "formConfigId", source = "formConfig.id")
    DiligenceFormResultDTO toDto(DiligenceFormResult entity);

    FieldResult toEntity(FieldResultDTO dto);
    FieldResultDTO toDto(FieldResult entity);
}
