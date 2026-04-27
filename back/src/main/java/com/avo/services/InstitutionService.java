package com.avo.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.avo.dtos.InstitutionDTO;
import com.avo.entities.Institution;
import com.avo.mappers.InstitutionMapper;
import com.avo.repositories.InstitutionRepository;
import com.querydsl.core.types.Predicate;

@Service
public class InstitutionService {

    private final InstitutionRepository repository;
    private final InstitutionMapper mapper;

    public InstitutionService(InstitutionRepository repository, InstitutionMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<InstitutionDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<InstitutionDTO> search(Predicate predicate, Pageable pageable) {
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public InstitutionDTO findById(Long id) {
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public InstitutionDTO create(InstitutionDTO dto) {
        Institution entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public InstitutionDTO update(InstitutionDTO dto) {
        Institution entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }
    
    public void delete(Long id) {
        repository.deleteById(id);
    }
}
