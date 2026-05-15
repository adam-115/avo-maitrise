package com.avo.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.avo.dtos.MatterEventDTO;
import com.avo.entities.MatterEvent;
import com.avo.mappers.MatterEventMapper;
import com.avo.repositories.MatterEventRepository;
import com.querydsl.core.types.Predicate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MatterEventService {

    private final MatterEventRepository repository;
    private final MatterEventMapper mapper;

    public MatterEventService(MatterEventRepository repository, MatterEventMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<MatterEventDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public List<MatterEventDTO> findAll() {
        return repository.findAll().stream().map(mapper::toDto).collect(Collectors.toList());
    }

    public Page<MatterEventDTO> search(Predicate predicate, Pageable pageable) {
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public MatterEventDTO findById(Long id) {
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public MatterEventDTO create(MatterEventDTO dto) {
        MatterEvent entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public MatterEventDTO update(MatterEventDTO dto) {
        MatterEvent entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
