package com.avo.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.avo.dtos.ClientPersonnePhysiqueDTO;
import com.avo.entities.ClientPersonnePhysique;
import com.avo.mappers.ClientPersonnePhysiqueMapper;
import com.avo.repositories.PersonnePhysiqueRepository;
import com.querydsl.core.types.Predicate;

@Service
public class PersonnePhysiqueService {

    private final PersonnePhysiqueRepository repository;
    private final ClientPersonnePhysiqueMapper mapper;

    public PersonnePhysiqueService(PersonnePhysiqueRepository repository, ClientPersonnePhysiqueMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<ClientPersonnePhysiqueDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<ClientPersonnePhysiqueDTO> search(Predicate predicate, Pageable pageable) {
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public ClientPersonnePhysiqueDTO findById(Long id) {
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public ClientPersonnePhysiqueDTO create(ClientPersonnePhysiqueDTO dto) {
        ClientPersonnePhysique entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public ClientPersonnePhysiqueDTO update(ClientPersonnePhysiqueDTO dto) {
        ClientPersonnePhysique entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }
    
    public void delete(Long id) {
        repository.deleteById(id);
    }
}
