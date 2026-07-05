package com.avo.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.avo.dtos.ClientMoralDTO;
import com.avo.entities.ClientMoral;
import com.avo.mappers.ClientMoralMapper;
import com.avo.repositories.ClientMoralRepository;
import com.querydsl.core.types.Predicate;

@Service
@Slf4j
public class ClientMoralService {

    private final ClientMoralRepository repository;
    private final ClientMoralMapper mapper;

    public ClientMoralService(ClientMoralRepository repository, ClientMoralMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<ClientMoralDTO> findAll(Pageable pageable) {
        log.info("[ENTER] Executing findAll");
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<ClientMoralDTO> search(Predicate predicate, Pageable pageable) {
        log.info("[ENTER] Executing search");
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public ClientMoralDTO findById(Long id) {
        log.info("[ENTER] Executing findById");
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public ClientMoralDTO create(ClientMoralDTO dto) {
        log.info("[ENTER] Executing create");
        ClientMoral entity = mapper.toEntity(dto);
        entity.linkChildren();
        return mapper.toDto(repository.save(entity));
    }

    public ClientMoralDTO update(ClientMoralDTO dto) {
        log.info("[ENTER] Executing update");
        ClientMoral existing = repository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Client not found"));
        ClientMoral incoming = mapper.toEntity(dto);
        existing.updateFieldsFrom(incoming);
        existing.linkChildren();
        return mapper.toDto(repository.save(existing));
    }
    
    public void delete(Long id) {
        log.info("[ENTER] Executing delete");
        repository.deleteById(id);
    }
}
