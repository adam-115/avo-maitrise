package com.avo.services;

import com.avo.dtos.DiligenceFormResultDTO;
import com.avo.entities.DiligenceFormResult;
import com.avo.mappers.DiligenceFormResultMapper;
import com.avo.repositories.DiligenceFormResultRepository;
import com.querydsl.core.types.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiligenceFormResultService {

    private final DiligenceFormResultRepository repository;
    private final DiligenceFormResultMapper mapper;

    public Page<DiligenceFormResultDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<DiligenceFormResultDTO> search(Predicate predicate, Pageable pageable) {
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public List<DiligenceFormResultDTO> findByClientId(Long clientId) {
        return repository.findByClientId(clientId).stream().map(mapper::toDto).collect(Collectors.toList());
    }

    public DiligenceFormResultDTO findById(String id) {
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    @Transactional
    public DiligenceFormResultDTO create(DiligenceFormResultDTO dto) {
        DiligenceFormResult entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    @Transactional
    public DiligenceFormResultDTO update(DiligenceFormResultDTO dto) {
        DiligenceFormResult entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    @Transactional
    public void delete(String id) {
        repository.deleteById(id);
    }
}
