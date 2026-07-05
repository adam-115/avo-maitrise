package com.avo.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.avo.dtos.ClientPersonnePhysiqueDTO;
import com.avo.entities.ClientPersonnePhysique;
import com.avo.mappers.ClientPersonnePhysiqueMapper;
import com.avo.repositories.PersonnePhysiqueRepository;
import com.querydsl.core.types.Predicate;

@Service
@Slf4j
public class PersonnePhysiqueService {

    private final PersonnePhysiqueRepository repository;
    private final ClientPersonnePhysiqueMapper mapper;

    public PersonnePhysiqueService(PersonnePhysiqueRepository repository, ClientPersonnePhysiqueMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<ClientPersonnePhysiqueDTO> findAll(Pageable pageable) {
        log.info("[ENTER] Executing findAll");
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<ClientPersonnePhysiqueDTO> search(Predicate predicate, Pageable pageable) {
        log.info("[ENTER] Executing search");
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public ClientPersonnePhysiqueDTO findById(Long id) {
        log.info("[ENTER] Executing findById");
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public ClientPersonnePhysiqueDTO create(ClientPersonnePhysiqueDTO dto) {
        log.info("[ENTER] Executing create");
        ClientPersonnePhysique entity = mapper.toEntity(dto);
        entity.linkChildren();
        return mapper.toDto(repository.save(entity));
    }

    public ClientPersonnePhysiqueDTO update(ClientPersonnePhysiqueDTO dto) {
        log.info("[ENTER] Executing update");
        ClientPersonnePhysique existing = repository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Client not found"));
        ClientPersonnePhysique incoming = mapper.toEntity(dto);
        existing.updateFieldsFrom(incoming);
        existing.linkChildren();
        return mapper.toDto(repository.save(existing));
    }
    
    public void delete(Long id) {
        log.info("[ENTER] Executing delete");
        repository.deleteById(id);
    }
}
