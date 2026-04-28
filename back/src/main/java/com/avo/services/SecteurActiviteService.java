package com.avo.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.avo.dtos.SecteurActiviteDTO;
import com.avo.entities.SecteurActivite;
import com.avo.mappers.SecteurActiviteMapper;
import com.avo.repositories.SecteurActiviteRepository;
import com.querydsl.core.types.Predicate;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SecteurActiviteService {

    private final SecteurActiviteRepository repository;
    private final SecteurActiviteMapper mapper;

    public SecteurActiviteService(SecteurActiviteRepository repository, SecteurActiviteMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<SecteurActiviteDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public List<SecteurActiviteDTO> findAll() {
        return repository.findAll().stream().map(mapper::toDto).collect(Collectors.toList());
    }

    public Page<SecteurActiviteDTO> search(Predicate predicate, Pageable pageable) {
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public SecteurActiviteDTO findById(Long id) {
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public SecteurActiviteDTO create(SecteurActiviteDTO dto) {
        SecteurActivite entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public SecteurActiviteDTO update(SecteurActiviteDTO dto) {
        SecteurActivite entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
