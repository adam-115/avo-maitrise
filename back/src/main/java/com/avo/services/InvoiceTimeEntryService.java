package com.avo.services;

import com.avo.dtos.InvoiceTimeEntryDTO;
import com.avo.entities.InvoiceTimeEntry;
import com.avo.mappers.InvoiceTimeEntryMapper;
import com.avo.repositories.InvoiceTimeEntryRepository;
import com.querydsl.core.types.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class InvoiceTimeEntryService {

    private final InvoiceTimeEntryRepository repository;
    private final InvoiceTimeEntryMapper mapper;

    public InvoiceTimeEntryService(InvoiceTimeEntryRepository repository, InvoiceTimeEntryMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<InvoiceTimeEntryDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<InvoiceTimeEntryDTO> search(Predicate predicate, Pageable pageable) {
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public InvoiceTimeEntryDTO findById(Long id) {
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public InvoiceTimeEntryDTO create(InvoiceTimeEntryDTO dto) {
        InvoiceTimeEntry entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public InvoiceTimeEntryDTO update(InvoiceTimeEntryDTO dto) {
        InvoiceTimeEntry entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public InvoiceTimeEntry saveEntity(InvoiceTimeEntry entity) {
        return repository.save(entity);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
