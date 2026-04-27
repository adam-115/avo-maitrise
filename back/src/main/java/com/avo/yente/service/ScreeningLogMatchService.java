package com.avo.yente.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.avo.entities.ScreeningLogMatch;
import com.avo.dtos.ScreeningLogMatchDTO;
import com.avo.mappers.ScreeningLogMatchMapper;
import com.avo.repositories.ScreeningLogMatchRepository;
import com.querydsl.core.types.Predicate;

@Service
public class ScreeningLogMatchService {

    private final ScreeningLogMatchRepository screeningLogMatchRepository;
    private final ScreeningLogMatchMapper mapper;

    public ScreeningLogMatchService(ScreeningLogMatchRepository screeningLogMatchRepository, ScreeningLogMatchMapper mapper) {
        this.screeningLogMatchRepository = screeningLogMatchRepository;
        this.mapper = mapper;
    }

    public Page<ScreeningLogMatchDTO> findAll(Pageable pageable) {
        return screeningLogMatchRepository.findAll(pageable).map(mapper::toDto);
    }

    public Page<ScreeningLogMatchDTO> search(Predicate predicate, Pageable pageable) {
        return screeningLogMatchRepository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public ScreeningLogMatchDTO findById(Long id) {
        return screeningLogMatchRepository.findById(id).map(mapper::toDto).orElse(null);
    }

    public ScreeningLogMatchDTO create(ScreeningLogMatchDTO dto) {
        ScreeningLogMatch entity = mapper.toEntity(dto);
        return mapper.toDto(screeningLogMatchRepository.save(entity));
    }

    public ScreeningLogMatchDTO update(ScreeningLogMatchDTO dto) {
        throw new RuntimeException("this method is not allowed ");
    }
    
    public void delete(Long id) {
        screeningLogMatchRepository.deleteById(id);
    }
}
