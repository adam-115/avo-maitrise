package com.avo.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.avo.dtos.ClientEntityDTO;
import com.avo.entities.ClientEntity;
import com.avo.mappers.ClientEntityMapper;
import com.avo.repositories.ClientRepository;
import com.querydsl.core.types.Predicate;

@Service
@Slf4j
public class ClientService {

    private final ClientRepository repository;
    private final ClientEntityMapper mapper;

    public ClientService(ClientRepository repository, ClientEntityMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<ClientEntityDTO> findAll(Pageable pageable) {
        log.info("[ENTER] Executing findAll");
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<ClientEntityDTO> findAllWithFilters(String searchTerm, String type, com.avo.entities.ClientStatus status, String risk, Pageable pageable) {
        log.info("[ENTER] Executing findAllWithFilters");
        return repository.searchWithFilters(searchTerm, type, status, risk, pageable).map(mapper::toDto);
    }

    public Page<ClientEntityDTO> search(Predicate predicate, Pageable pageable) {
        log.info("[ENTER] Executing search");
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public ClientEntityDTO findById(Long id) {
        log.info("[ENTER] Executing findById");
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public ClientEntityDTO create(ClientEntityDTO dto) {
        log.info("[ENTER] Executing create");
        ClientEntity entity = mapper.toEntity(dto);
        entity.linkChildren();
        return mapper.toDto(repository.save(entity));
    }

    public ClientEntityDTO update(ClientEntityDTO dto) {
        log.info("[ENTER] Executing update");
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
        log.info("[ENTER] Executing delete");
        repository.deleteById(id);
    }

    public ClientEntityDTO updateStatus(Long id, com.avo.entities.ClientStatus status) {
        log.info("[ENTER] Executing updateStatus");
        ClientEntity entity = repository.findById(id).orElseThrow(() -> new RuntimeException("Client not found"));
        entity.setClientStatus(status);
        return mapper.toDto(repository.save(entity));
    }
}
