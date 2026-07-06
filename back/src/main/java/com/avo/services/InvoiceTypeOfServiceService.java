package com.avo.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.avo.dtos.InvoiceTypeOfServiceDTO;
import com.avo.entities.InvoiceTypeOfService;
import com.avo.mappers.InvoiceTypeOfServiceMapper;
import com.avo.repositories.InvoiceTypeOfServiceRepository;
import com.querydsl.core.types.Predicate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class InvoiceTypeOfServiceService {

    private final InvoiceTypeOfServiceRepository repository;
    private final InvoiceTypeOfServiceMapper mapper;

    public InvoiceTypeOfServiceService(InvoiceTypeOfServiceRepository repository, InvoiceTypeOfServiceMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<InvoiceTypeOfServiceDTO> findAll(Pageable pageable) {
        log.info("[ENTER] Executing findAll");
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public List<InvoiceTypeOfServiceDTO> findAll() {
        log.info("[ENTER] Executing findAll");
        return repository.findAll().stream().map(mapper::toDto).collect(Collectors.toList());
    }

    public Page<InvoiceTypeOfServiceDTO> search(Predicate predicate, Pageable pageable) {
        log.info("[ENTER] Executing search");
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public InvoiceTypeOfServiceDTO findById(Long id) {
        log.info("[ENTER] Executing findById");
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public InvoiceTypeOfServiceDTO create(InvoiceTypeOfServiceDTO dto) {
        log.info("[ENTER] Executing create");
        InvoiceTypeOfService entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public InvoiceTypeOfServiceDTO update(InvoiceTypeOfServiceDTO dto) {
        log.info("[ENTER] Executing update");
        InvoiceTypeOfService entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public void delete(Long id) {
        log.info("[ENTER] Executing delete (soft delete)");
        repository.findById(id).ifPresent(entity -> {
            entity.setActif(false);
            repository.save(entity);
        });
    }
}
