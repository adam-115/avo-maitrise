package com.avo.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.avo.dtos.ClientEntityDTO;
import com.avo.entities.ClientEntity;
import com.avo.mappers.ClientEntityMapper;
import com.avo.repositories.ClientRepository;
import com.querydsl.core.types.Predicate;

@Service
public class ClientService {

    private final ClientRepository repository;
    private final ClientEntityMapper mapper;

    public ClientService(ClientRepository repository, ClientEntityMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<ClientEntityDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<ClientEntityDTO> search(Predicate predicate, Pageable pageable) {
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public ClientEntityDTO findById(Long id) {
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public ClientEntityDTO create(ClientEntityDTO dto) {
        ClientEntity entity = mapper.toEntity(dto);
        entity.linkChildren();
        return mapper.toDto(repository.save(entity));
    }

    public ClientEntityDTO update(ClientEntityDTO dto) {
        ClientEntity existing = repository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Client not found"));
        ClientEntity incoming = mapper.toEntity(dto);

        if (existing instanceof com.avo.entities.ClientPersonnePhysique && incoming instanceof com.avo.entities.ClientPersonnePhysique) {
            ((com.avo.entities.ClientPersonnePhysique) existing).updateFieldsFrom((com.avo.entities.ClientPersonnePhysique) incoming);
        } else if (existing instanceof com.avo.entities.ClientMoral && incoming instanceof com.avo.entities.ClientMoral) {
            ((com.avo.entities.ClientMoral) existing).updateFieldsFrom((com.avo.entities.ClientMoral) incoming);
        } else if (existing instanceof com.avo.entities.Association && incoming instanceof com.avo.entities.Association) {
            ((com.avo.entities.Association) existing).updateFieldsFrom((com.avo.entities.Association) incoming);
        } else if (existing instanceof com.avo.entities.Institution && incoming instanceof com.avo.entities.Institution) {
            ((com.avo.entities.Institution) existing).updateFieldsFrom((com.avo.entities.Institution) incoming);
        } else {
            existing.updateBasicFieldsFrom(incoming);
        }

        existing.linkChildren();
        return mapper.toDto(repository.save(existing));
    }
    
    public void delete(Long id) {
        repository.deleteById(id);
    }

    public ClientEntityDTO updateStatus(Long id, com.avo.entities.ClientStatus status) {
        ClientEntity entity = repository.findById(id).orElseThrow(() -> new RuntimeException("Client not found"));
        entity.setClientStatus(status);
        return mapper.toDto(repository.save(entity));
    }
}
