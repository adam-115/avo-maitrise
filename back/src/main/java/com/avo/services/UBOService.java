package com.avo.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.avo.dtos.UBODTO;
import com.avo.entities.UBO;
import com.avo.mappers.UBOMapper;
import com.avo.repositories.ScreeningExecutionRepository;
import com.avo.repositories.ScreeningMatchRepository;
import com.avo.repositories.UBORepository;
import com.querydsl.core.types.Predicate;

@Service
@Slf4j
public class UBOService {

    private final UBORepository repository;
    private final UBOMapper mapper;
    private final ScreeningMatchRepository screeningMatchRepository;
    private final ScreeningExecutionRepository screeningExecutionRepository;

    public UBOService(UBORepository repository, 
                      UBOMapper mapper,
                      ScreeningMatchRepository screeningMatchRepository,
                      ScreeningExecutionRepository screeningExecutionRepository) {
        this.repository = repository;
        this.mapper = mapper;
        this.screeningMatchRepository = screeningMatchRepository;
        this.screeningExecutionRepository = screeningExecutionRepository;
    }

    public Page<UBODTO> findAll(Pageable pageable) {
        log.info("[ENTER] Executing findAll");
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<UBODTO> search(Predicate predicate, Pageable pageable) {
        log.info("[ENTER] Executing search");
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public UBODTO findById(Long id) {
        log.info("[ENTER] Executing findById");
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public UBODTO create(UBODTO dto) {
        log.info("[ENTER] Executing create");
        UBO entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public UBODTO update(UBODTO dto) {
        log.info("[ENTER] Executing update");
        UBO entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }
    
    @Transactional
    public void delete(Long id) {
        log.info("[ENTER] Executing delete for UBO id: {}", id);
        screeningMatchRepository.deleteByUboId(id);
        screeningExecutionRepository.deleteByUboId(id);
        repository.deleteById(id);
    }
}
