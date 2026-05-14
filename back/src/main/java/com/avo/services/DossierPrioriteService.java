package com.avo.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.avo.dtos.DossierPrioriteDTO;
import com.avo.entities.DossierPriorite;
import com.avo.mappers.DossierPrioriteMapper;
import com.avo.repositories.DossierPrioriteRepository;
import com.querydsl.core.types.Predicate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DossierPrioriteService {

    private final DossierPrioriteRepository repository;
    private final DossierPrioriteMapper mapper;

    public DossierPrioriteService(DossierPrioriteRepository repository, DossierPrioriteMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<DossierPrioriteDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public List<DossierPrioriteDTO> findAll() {
        return repository.findAll().stream().map(mapper::toDto).collect(Collectors.toList());
    }

    public Page<DossierPrioriteDTO> search(Predicate predicate, Pageable pageable) {
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public DossierPrioriteDTO findById(Long id) {
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public DossierPrioriteDTO create(DossierPrioriteDTO dto) {
        DossierPriorite entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public DossierPrioriteDTO update(DossierPrioriteDTO dto) {
        DossierPriorite entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
