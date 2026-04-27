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
        return mapper.toDto(repository.save(entity));
    }

    public ClientEntityDTO update(ClientEntityDTO dto) {
        ClientEntity entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }
    
    public void delete(Long id) {
        repository.deleteById(id);
    }
}
