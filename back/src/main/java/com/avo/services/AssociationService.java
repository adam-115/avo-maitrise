package com.avo.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.avo.dtos.AssociationDTO;
import com.avo.entities.Association;
import com.avo.mappers.AssociationMapper;
import com.avo.repositories.AssociationRepository;
import com.querydsl.core.types.Predicate;

@Service
@Slf4j
public class AssociationService {

    private final AssociationRepository repository;
    private final AssociationMapper mapper;

    public AssociationService(AssociationRepository repository, AssociationMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<AssociationDTO> findAll(Pageable pageable) {
        log.info("[ENTER] Executing findAll");
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<AssociationDTO> search(Predicate predicate, Pageable pageable) {
        log.info("[ENTER] Executing search");
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public AssociationDTO findById(Long id) {
        log.info("[ENTER] Executing findById");
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public AssociationDTO create(AssociationDTO dto) {
        log.info("[ENTER] Executing create");
        Association entity = mapper.toEntity(dto);
        entity.linkChildren();
        return mapper.toDto(repository.save(entity));
    }

    public AssociationDTO update(AssociationDTO dto) {
        log.info("[ENTER] Executing update");
        Association existing = repository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Client not found"));
        Association incoming = mapper.toEntity(dto);
        existing.updateFieldsFrom(incoming);
        existing.linkChildren();
        return mapper.toDto(repository.save(existing));
    }
    
    public void delete(Long id) {
        log.info("[ENTER] Executing delete");
        repository.deleteById(id);
    }
}
