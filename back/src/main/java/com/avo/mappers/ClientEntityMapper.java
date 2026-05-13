package com.avo.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.SubclassMapping;
import org.mapstruct.factory.Mappers;

import com.avo.entities.Association;
import com.avo.entities.ClientMoral;
import com.avo.entities.ClientPersonnePhysique;
import com.avo.entities.Institution;

import com.avo.dtos.ClientEntityDTO;
import com.avo.entities.ClientEntity;

@Mapper(componentModel = "spring", uses = {DocumentMapper.class, ContactPointMapper.class, UBOMapper.class})
public interface ClientEntityMapper {

    ClientEntityMapper INSTANCE = Mappers.getMapper(ClientEntityMapper.class);
    
    @SubclassMapping(source = ClientPersonnePhysique.class, target = ClientEntityDTO.class)
    @SubclassMapping(source = ClientMoral.class, target = ClientEntityDTO.class)
    @SubclassMapping(source = Association.class, target = ClientEntityDTO.class)
    @SubclassMapping(source = Institution.class, target = ClientEntityDTO.class)
    ClientEntityDTO toDto(ClientEntity client);

    default ClientEntity toEntity(ClientEntityDTO clientDTO) {
        if (clientDTO == null) return null;
        if (clientDTO.getType() == null) return null;

        return switch (clientDTO.getType()) {
            case "PERSONNE" -> toPersonnePhysique(clientDTO);
            case "SOCIETE" -> toClientMoral(clientDTO);
            case "ASSOCIATION" -> toAssociation(clientDTO);
            case "INSTITUTION" -> toInstitution(clientDTO);
            default -> null;
        };
    }

    ClientPersonnePhysique toPersonnePhysique(ClientEntityDTO dto);
    ClientMoral toClientMoral(ClientEntityDTO dto);
    Association toAssociation(ClientEntityDTO dto);
    Institution toInstitution(ClientEntityDTO dto);
}
