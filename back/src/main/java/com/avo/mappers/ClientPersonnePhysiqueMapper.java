package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

import com.avo.dtos.ClientPersonnePhysiqueDTO;
import com.avo.entities.ClientPersonnePhysique;

@Mapper(componentModel = "spring", uses = {DocumentMapper.class})
public interface ClientPersonnePhysiqueMapper {

    ClientPersonnePhysiqueMapper INSTANCE = Mappers.getMapper(ClientPersonnePhysiqueMapper.class);

    ClientPersonnePhysiqueDTO toDto(ClientPersonnePhysique clientPersonnePhysique);

    ClientPersonnePhysique toEntity(ClientPersonnePhysiqueDTO clientPersonnePhysiqueDTO);
}
