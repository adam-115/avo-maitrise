package com.avo.yente.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.avo.entities.ScreeningExecution;
import com.avo.dtos.ScreeningExecutionDTO;
import com.avo.mappers.ScreeningExecutionMapper;
import com.avo.repositories.ScreeningExecutionRepository;
import com.querydsl.core.types.Predicate;

@Service
public class ScreeningExecutionService {

    private final ScreeningExecutionRepository screeningExecutionRepository;
    private final ScreeningExecutionMapper mapper;
    
    public ScreeningExecutionService(ScreeningExecutionRepository screeningExecutionRepository, ScreeningExecutionMapper mapper) {
        this.screeningExecutionRepository = screeningExecutionRepository;
        this.mapper = mapper;
    }

    public Page<ScreeningExecutionDTO> findAll(Pageable pageable) {
        return screeningExecutionRepository.findAll(pageable).map(mapper::toDto);
    }

    public Page<ScreeningExecutionDTO> search(Predicate predicate, Pageable pageable) {
        return screeningExecutionRepository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public ScreeningExecutionDTO findById(Long id) {
        return screeningExecutionRepository.findById(id).map(mapper::toDto).orElse(null);
    }

    public ScreeningExecutionDTO create(ScreeningExecutionDTO dto) {
        ScreeningExecution entity = mapper.toEntity(dto);
        return mapper.toDto(screeningExecutionRepository.save(entity));
    }

    public ScreeningExecutionDTO update(ScreeningExecutionDTO dto) {
        throw new RuntimeException("this method is not allowed ");
    }
    
    public void delete(Long id) {
        screeningExecutionRepository.deleteById(id);
    }
}
