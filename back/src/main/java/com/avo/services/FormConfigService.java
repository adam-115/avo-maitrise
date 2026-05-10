package com.avo.services;

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
public class FormConfigService {

    private final FormConfigRepository repository;
    private final FormConfigMapper mapper;

    public Page<FormConfigDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<FormConfigDTO> search(Predicate predicate, Pageable pageable) {
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public FormConfigDTO findById(String id) {
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    @Transactional
    public FormConfigDTO create(FormConfigDTO dto) {
        FormConfig entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    @Transactional
    public FormConfigDTO update(FormConfigDTO dto) {
        FormConfig entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    @Transactional
    public void delete(String id) {
        repository.deleteById(id);
    }
}
