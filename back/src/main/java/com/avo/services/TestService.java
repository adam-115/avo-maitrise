package com.avo.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.avo.dtos.TestEntityDTO;
import com.avo.entities.TestEntity;
import com.avo.mappers.TestEntityMapper;
import com.avo.repositories.TestRepository;
import com.querydsl.core.types.Predicate;

@Service
@Slf4j
public class TestService {

    private final TestRepository repository;
    private final TestEntityMapper mapper;

    public TestService(TestRepository repository, TestEntityMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<TestEntityDTO> findAll(Pageable pageable) {
        log.info("[ENTER] Executing findAll");
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<TestEntityDTO> search(Predicate predicate, Pageable pageable) {
        log.info("[ENTER] Executing search");
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public TestEntityDTO findById(Long id) {
        log.info("[ENTER] Executing findById");
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public TestEntityDTO create(TestEntityDTO dto) {
        log.info("[ENTER] Executing create");
        TestEntity entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public TestEntityDTO update(TestEntityDTO dto) {
        log.info("[ENTER] Executing update");
        TestEntity entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }
    
    public void delete(Long id) {
        log.info("[ENTER] Executing delete");
        repository.deleteById(id);
    }
}
