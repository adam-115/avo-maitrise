package com.avo.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.avo.dtos.InvoiceDossierServieStatusDTO;
import com.avo.entities.InvoiceDossierServieStatus;
import com.avo.mappers.InvoiceDossierServieStatusMapper;
import com.avo.repositories.InvoiceDossierServieStatusRepository;
import com.querydsl.core.types.Predicate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class InvoiceDossierServieStatusService {

    private final InvoiceDossierServieStatusRepository repository;
    private final InvoiceDossierServieStatusMapper mapper;

    public InvoiceDossierServieStatusService(InvoiceDossierServieStatusRepository repository, InvoiceDossierServieStatusMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<InvoiceDossierServieStatusDTO> findAll(Pageable pageable) {
        log.info("[ENTER] Executing findAll");
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public List<InvoiceDossierServieStatusDTO> findAll() {
        log.info("[ENTER] Executing findAll");
        return repository.findAll().stream().map(mapper::toDto).collect(Collectors.toList());
    }

    public Page<InvoiceDossierServieStatusDTO> search(Predicate predicate, Pageable pageable) {
        log.info("[ENTER] Executing search");
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public InvoiceDossierServieStatusDTO findById(Long id) {
        log.info("[ENTER] Executing findById");
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public InvoiceDossierServieStatusDTO create(InvoiceDossierServieStatusDTO dto) {
        log.info("[ENTER] Executing create");
        InvoiceDossierServieStatus entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public InvoiceDossierServieStatusDTO update(InvoiceDossierServieStatusDTO dto) {
        log.info("[ENTER] Executing update");
        InvoiceDossierServieStatus entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public void delete(Long id) {
        log.info("[ENTER] Executing delete (soft delete)");
        repository.findById(id).ifPresent(entity -> {
            entity.setActive(false);
            repository.save(entity);
        });
    }
}
