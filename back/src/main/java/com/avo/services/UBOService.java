package com.avo.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.avo.dtos.UBODTO;
import com.avo.entities.UBO;
import com.avo.mappers.UBOMapper;
import com.avo.repositories.UBORepository;
import com.querydsl.core.types.Predicate;

@Service
public class UBOService {

    private final UBORepository repository;
    private final UBOMapper mapper;

    public UBOService(UBORepository repository, UBOMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<UBODTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<UBODTO> search(Predicate predicate, Pageable pageable) {
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public UBODTO findById(Long id) {
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public UBODTO create(UBODTO dto) {
        UBO entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public UBODTO update(UBODTO dto) {
        UBO entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }
    
    public void delete(Long id) {
        repository.deleteById(id);
    }
}
