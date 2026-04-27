package com.avo.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.avo.dtos.AssociationDTO;
import com.avo.entities.Association;
import com.avo.mappers.AssociationMapper;
import com.avo.repositories.AssociationRepository;
import com.querydsl.core.types.Predicate;

@Service
public class AssociationService {

    private final AssociationRepository repository;
    private final AssociationMapper mapper;

    public AssociationService(AssociationRepository repository, AssociationMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<AssociationDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<AssociationDTO> search(Predicate predicate, Pageable pageable) {
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public AssociationDTO findById(Long id) {
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public AssociationDTO create(AssociationDTO dto) {
        Association entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public AssociationDTO update(AssociationDTO dto) {
        Association entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }
    
    public void delete(Long id) {
        repository.deleteById(id);
    }
}
