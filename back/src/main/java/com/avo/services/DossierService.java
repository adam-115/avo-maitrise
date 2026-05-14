package com.avo.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.avo.dtos.DossierDTO;
import com.avo.entities.Dossier;
import com.avo.mappers.DossierMapper;
import com.avo.repositories.DossierRepository;
import com.querydsl.core.types.Predicate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DossierService {

    private final DossierRepository repository;
    private final DossierMapper mapper;

    public DossierService(DossierRepository repository, DossierMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<DossierDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public List<DossierDTO> findAll() {
        return repository.findAll().stream().map(mapper::toDto).collect(Collectors.toList());
    }

    public Page<DossierDTO> search(Predicate predicate, Pageable pageable) {
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public DossierDTO findById(Long id) {
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public DossierDTO create(DossierDTO dto) {
        Dossier entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public DossierDTO update(DossierDTO dto) {
        Dossier entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
