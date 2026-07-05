package com.avo.services;

import lombok.extern.slf4j.Slf4j;
import com.avo.dtos.ClientDiligenceStatusDTO;
import com.avo.entities.ClientDiligenceStatus;
import com.avo.mappers.ClientDiligenceStatusMapper;
import com.avo.repositories.ClientDiligenceStatusRepository;
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
@Transactional(readOnly = true)
@Slf4j
public class ClientDiligenceStatusService {

    private final ClientDiligenceStatusRepository repository;
    private final ClientDiligenceStatusMapper mapper;

    public Page<ClientDiligenceStatusDTO> findAll(Pageable pageable) {
        log.info("[ENTER] Executing findAll");
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<ClientDiligenceStatusDTO> search(Predicate predicate, Pageable pageable) {
        log.info("[ENTER] Executing search");
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public List<ClientDiligenceStatusDTO> findByClientId(Long clientId) {
        log.info("[ENTER] Executing findByClientId");
        return repository.findByClientId(clientId).stream().map(mapper::toDto).collect(Collectors.toList());
    }

    public ClientDiligenceStatusDTO findByClientIdAndFormConfigId(Long clientId, String formConfigId) {
        log.info("[ENTER] Executing findByClientIdAndFormConfigId");
        return repository.findByClientIdAndFormConfigId(clientId, formConfigId).map(mapper::toDto).orElse(null);
    }

    @Transactional
    public ClientDiligenceStatusDTO create(ClientDiligenceStatusDTO dto) {
        log.info("[ENTER] Executing create");
        ClientDiligenceStatus entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    @Transactional
    public ClientDiligenceStatusDTO update(ClientDiligenceStatusDTO dto) {
        log.info("[ENTER] Executing update");
        ClientDiligenceStatus entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    @Transactional
    public void delete(String id) {
        log.info("[ENTER] Executing delete");
        repository.findById(id).ifPresent(entity -> {
            entity.setEnabled(false);
            repository.save(entity);
        });
    }
}
