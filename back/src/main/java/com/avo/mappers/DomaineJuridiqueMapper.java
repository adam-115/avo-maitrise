package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import com.avo.dtos.DomaineJuridiqueDTO;
import com.avo.entities.DomaineJuridique;

@Mapper(componentModel = "spring")
public interface DomaineJuridiqueMapper {

    DomaineJuridiqueMapper INSTANCE = Mappers.getMapper(DomaineJuridiqueMapper.class);

    @Mapping(source = "displayOrder", target = "order")
    DomaineJuridiqueDTO toDto(DomaineJuridique domaineJuridique);

    @Mapping(source = "order", target = "displayOrder")
    DomaineJuridique toEntity(DomaineJuridiqueDTO domaineJuridiqueDTO);
}
