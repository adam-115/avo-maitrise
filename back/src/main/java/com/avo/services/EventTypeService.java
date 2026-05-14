package com.avo.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.avo.dtos.EventTypeDTO;
import com.avo.entities.EventType;
import com.avo.mappers.EventTypeMapper;
import com.avo.repositories.EventTypeRepository;
import com.querydsl.core.types.Predicate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EventTypeService {

    private final EventTypeRepository repository;
    private final EventTypeMapper mapper;

    public EventTypeService(EventTypeRepository repository, EventTypeMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<EventTypeDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public List<EventTypeDTO> findAll() {
        return repository.findAll().stream().map(mapper::toDto).collect(Collectors.toList());
    }

    public Page<EventTypeDTO> search(Predicate predicate, Pageable pageable) {
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public EventTypeDTO findById(Long id) {
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public EventTypeDTO create(EventTypeDTO dto) {
        EventType entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public EventTypeDTO update(EventTypeDTO dto) {
        EventType entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
