package com.avo.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.avo.dtos.DomaineJuridiqueDTO;
import com.avo.entities.DomaineJuridique;
import com.avo.mappers.DomaineJuridiqueMapper;
import com.avo.repositories.DomaineJuridiqueRepository;
import com.querydsl.core.types.Predicate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DomaineJuridiqueService {

    private final DomaineJuridiqueRepository repository;
    private final DomaineJuridiqueMapper mapper;

    public DomaineJuridiqueService(DomaineJuridiqueRepository repository, DomaineJuridiqueMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<DomaineJuridiqueDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public List<DomaineJuridiqueDTO> findAll() {
        return repository.findAll().stream().map(mapper::toDto).collect(Collectors.toList());
    }

    public Page<DomaineJuridiqueDTO> search(Predicate predicate, Pageable pageable) {
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public DomaineJuridiqueDTO findById(Long id) {
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public DomaineJuridiqueDTO create(DomaineJuridiqueDTO dto) {
        DomaineJuridique entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public DomaineJuridiqueDTO update(DomaineJuridiqueDTO dto) {
        DomaineJuridique entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
