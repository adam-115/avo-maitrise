package com.avo.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.avo.dtos.NoteCategoryDTO;
import com.avo.entities.NoteCategory;
import com.avo.mappers.NoteCategoryMapper;
import com.avo.repositories.NoteCategoryRepository;
import com.querydsl.core.types.Predicate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class NoteCategoryService {

    private final NoteCategoryRepository repository;
    private final NoteCategoryMapper mapper;

    public NoteCategoryService(NoteCategoryRepository repository, NoteCategoryMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<NoteCategoryDTO> findAll(Pageable pageable) {
        log.info("[ENTER] Executing findAll");
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public List<NoteCategoryDTO> findAll() {
        log.info("[ENTER] Executing findAll");
        return repository.findAll().stream().map(mapper::toDto).collect(Collectors.toList());
    }

    public Page<NoteCategoryDTO> search(Predicate predicate, Pageable pageable) {
        log.info("[ENTER] Executing search");
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public NoteCategoryDTO findById(Long id) {
        log.info("[ENTER] Executing findById");
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public NoteCategoryDTO create(NoteCategoryDTO dto) {
        log.info("[ENTER] Executing create");
        NoteCategory entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public NoteCategoryDTO update(NoteCategoryDTO dto) {
        log.info("[ENTER] Executing update");
        NoteCategory entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public void delete(Long id) {
        log.info("[ENTER] Executing delete");
        repository.deleteById(id);
    }
}
