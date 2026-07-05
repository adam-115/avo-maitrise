package com.avo.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.avo.dtos.StatutDossierDTO;
import com.avo.entities.StatutDossier;
import com.avo.mappers.StatutDossierMapper;
import com.avo.repositories.StatutDossierRepository;
import com.querydsl.core.types.Predicate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class StatutDossierService {

    private final StatutDossierRepository repository;
    private final StatutDossierMapper mapper;

    public StatutDossierService(StatutDossierRepository repository, StatutDossierMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<StatutDossierDTO> findAll(Pageable pageable) {
        log.info("[ENTER] Executing findAll");
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public List<StatutDossierDTO> findAll() {
        log.info("[ENTER] Executing findAll");
        return repository.findAll().stream().map(mapper::toDto).collect(Collectors.toList());
    }

    public Page<StatutDossierDTO> search(Predicate predicate, Pageable pageable) {
        log.info("[ENTER] Executing search");
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public StatutDossierDTO findById(Long id) {
        log.info("[ENTER] Executing findById");
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public StatutDossierDTO create(StatutDossierDTO dto) {
        log.info("[ENTER] Executing create");
        StatutDossier entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public StatutDossierDTO update(StatutDossierDTO dto) {
        log.info("[ENTER] Executing update");
        StatutDossier entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public void delete(Long id) {
        log.info("[ENTER] Executing delete");
        repository.deleteById(id);
    }
}
