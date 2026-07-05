package com.avo.services;

import lombok.extern.slf4j.Slf4j;
import com.avo.dtos.FormConfigDTO;
import com.avo.entities.FormConfig;
import com.avo.mappers.FormConfigMapper;
import com.avo.repositories.FormConfigRepository;
import com.querydsl.core.types.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class FormConfigService {

    private final FormConfigRepository repository;
    private final FormConfigMapper mapper;

    @Transactional(readOnly = true)
    public Page<FormConfigDTO> findAll(Pageable pageable) {
        log.info("[ENTER] Executing findAll");
        return repository.findAll(pageable).map(mapper::toDto);
    }

    @Transactional(readOnly = true)
    public Page<FormConfigDTO> search(Predicate predicate, Pageable pageable) {
        log.info("[ENTER] Executing search");
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    @Transactional(readOnly = true)
    public FormConfigDTO findById(String id) {
        log.info("[ENTER] Executing findById");
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    @Transactional
    public FormConfigDTO create(FormConfigDTO dto) {
        log.info("[ENTER] Executing create");
        FormConfig entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    @Transactional
    public FormConfigDTO update(FormConfigDTO dto) {
        log.info("[ENTER] Executing update");
        FormConfig entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    @Transactional
    public void delete(String id) {
        log.info("[ENTER] Executing delete");
        repository.deleteById(id);
    }
}
