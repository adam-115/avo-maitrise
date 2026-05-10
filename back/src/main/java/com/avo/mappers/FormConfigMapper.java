package com.avo.mappers;

import com.avo.dtos.FormConfigDTO;
import com.avo.dtos.FieldConfigDTO;
import com.avo.dtos.FieldOptionDTO;
import com.avo.entities.FormConfig;
import com.avo.entities.FieldConfig;
import com.avo.entities.FieldOption;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface FormConfigMapper {
    FormConfig toEntity(FormConfigDTO dto);
    FormConfigDTO toDto(FormConfig entity);

    FieldConfig toEntity(FieldConfigDTO dto);
    FieldConfigDTO toDto(FieldConfig entity);

    FieldOption toEntity(FieldOptionDTO dto);
    FieldOptionDTO toDto(FieldOption entity);
}
