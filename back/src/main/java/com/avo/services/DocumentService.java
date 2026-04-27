package com.avo.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.avo.dtos.DocumentDTO;
import com.avo.entities.Document;
import com.avo.mappers.DocumentMapper;
import com.avo.repositories.DocumentRepository;
import com.querydsl.core.types.Predicate;

@Service
public class DocumentService {

    private final DocumentRepository repository;
    private final DocumentMapper mapper;

    public DocumentService(DocumentRepository repository, DocumentMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<DocumentDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<DocumentDTO> search(Predicate predicate, Pageable pageable) {
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public DocumentDTO findById(Long id) {
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public DocumentDTO create(DocumentDTO dto) {
        Document entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public DocumentDTO update(DocumentDTO dto) {
        Document entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }
    
    public void delete(Long id) {
        repository.deleteById(id);
    }
}
