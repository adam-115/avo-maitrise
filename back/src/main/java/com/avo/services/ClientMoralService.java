package com.avo.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.avo.dtos.ClientMoralDTO;
import com.avo.entities.ClientMoral;
import com.avo.mappers.ClientMoralMapper;
import com.avo.repositories.ClientMoralRepository;
import com.querydsl.core.types.Predicate;

@Service
public class ClientMoralService {

    private final ClientMoralRepository repository;
    private final ClientMoralMapper mapper;

    public ClientMoralService(ClientMoralRepository repository, ClientMoralMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<ClientMoralDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<ClientMoralDTO> search(Predicate predicate, Pageable pageable) {
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public ClientMoralDTO findById(Long id) {
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public ClientMoralDTO create(ClientMoralDTO dto) {
        ClientMoral entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public ClientMoralDTO update(ClientMoralDTO dto) {
        ClientMoral entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }
    
    public void delete(Long id) {
        repository.deleteById(id);
    }
}
