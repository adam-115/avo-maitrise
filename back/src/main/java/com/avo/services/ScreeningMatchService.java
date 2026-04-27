package com.avo.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.avo.dtos.ScreeningMatchDTO;
import com.avo.entities.ScreeningMatch;
import com.avo.mappers.ScreeningMatchMapper;
import com.avo.repositories.ScreeningMatchRepository;
import com.querydsl.core.types.Predicate;

@Service
public class ScreeningMatchService {

    private final ScreeningMatchRepository repository;
    private final ScreeningMatchMapper mapper;

    public ScreeningMatchService(ScreeningMatchRepository repository, ScreeningMatchMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<ScreeningMatchDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<ScreeningMatchDTO> search(Predicate predicate, Pageable pageable) {
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public ScreeningMatchDTO findById(Long id) {
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public ScreeningMatchDTO create(ScreeningMatchDTO dto) {
        ScreeningMatch entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public ScreeningMatchDTO update(ScreeningMatchDTO dto) {
        ScreeningMatch entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }
    
    public void delete(Long id) {
        repository.deleteById(id);
    }
}
