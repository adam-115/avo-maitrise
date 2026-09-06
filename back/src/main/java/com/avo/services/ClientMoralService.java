package com.avo.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.avo.dtos.ClientMoralDTO;
import com.avo.entities.ClientMoral;
import com.avo.entities.UBO;
import com.avo.mappers.ClientMoralMapper;
import com.avo.repositories.ClientMoralRepository;
import com.avo.repositories.ScreeningExecutionRepository;
import com.avo.repositories.ScreeningMatchRepository;
import com.querydsl.core.types.Predicate;

@Service
@Slf4j
public class ClientMoralService {

    private final ClientMoralRepository repository;
    private final ClientMoralMapper mapper;
    private final ScreeningMatchRepository screeningMatchRepository;
    private final ScreeningExecutionRepository screeningExecutionRepository;

    public ClientMoralService(ClientMoralRepository repository, 
                              ClientMoralMapper mapper,
                              ScreeningMatchRepository screeningMatchRepository,
                              ScreeningExecutionRepository screeningExecutionRepository) {
        this.repository = repository;
        this.mapper = mapper;
        this.screeningMatchRepository = screeningMatchRepository;
        this.screeningExecutionRepository = screeningExecutionRepository;
    }

    public Page<ClientMoralDTO> findAll(Pageable pageable) {
        log.info("[ENTER] Executing findAll");
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<ClientMoralDTO> search(Predicate predicate, Pageable pageable) {
        log.info("[ENTER] Executing search");
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public ClientMoralDTO findById(Long id) {
        log.info("[ENTER] Executing findById");
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public ClientMoralDTO create(ClientMoralDTO dto) {
        log.info("[ENTER] Executing create");
        ClientMoral entity = mapper.toEntity(dto);
        entity.linkChildren();
        return mapper.toDto(repository.save(entity));
    }

    @Transactional
    public ClientMoralDTO update(ClientMoralDTO dto) {
        log.info("[ENTER] Executing update for ClientMoral id: {}", dto.getId());
        ClientMoral existing = repository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Client not found"));

        // Clean up screening matches and executions for any UBOs that will be removed
        if (existing.getUbos() != null && dto.getUbos() != null) {
            java.util.Set<Long> incomingUboIds = dto.getUbos().stream()
                    .map(u -> u.getId())
                    .filter(java.util.Objects::nonNull)
                    .collect(java.util.stream.Collectors.toSet());
            for (UBO u : existing.getUbos()) {
                if (u.getId() != null && !incomingUboIds.contains(u.getId())) {
                    screeningMatchRepository.deleteByUboId(u.getId());
                    screeningExecutionRepository.deleteByUboId(u.getId());
                }
            }
        }

        ClientMoral incoming = mapper.toEntity(dto);
        existing.updateFieldsFrom(incoming);
        existing.linkChildren();
        return mapper.toDto(repository.save(existing));
    }
    
    @Transactional
    public void delete(Long id) {
        log.info("[ENTER] Executing delete for ClientMoral id: {}", id);
        ClientMoral client = repository.findById(id).orElse(null);
        if (client != null && client.getUbos() != null) {
            for (UBO u : client.getUbos()) {
                if (u.getId() != null) {
                    screeningMatchRepository.deleteByUboId(u.getId());
                    screeningExecutionRepository.deleteByUboId(u.getId());
                }
            }
        }
        screeningMatchRepository.deleteByClientId(id);
        screeningExecutionRepository.deleteByClientId(id);
        repository.deleteById(id);
    }
}
