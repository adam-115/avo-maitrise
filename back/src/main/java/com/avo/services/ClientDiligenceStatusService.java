package com.avo.services;

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
public class ClientDiligenceStatusService {

    private final ClientDiligenceStatusRepository repository;
    private final ClientDiligenceStatusMapper mapper;

    public Page<ClientDiligenceStatusDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<ClientDiligenceStatusDTO> search(Predicate predicate, Pageable pageable) {
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public List<ClientDiligenceStatusDTO> findByClientId(Long clientId) {
        return repository.findByClientId(clientId).stream().map(mapper::toDto).collect(Collectors.toList());
    }

    public ClientDiligenceStatusDTO findByClientIdAndFormConfigId(Long clientId, String formConfigId) {
        return repository.findByClientIdAndFormConfigId(clientId, formConfigId).map(mapper::toDto).orElse(null);
    }

    @Transactional
    public ClientDiligenceStatusDTO create(ClientDiligenceStatusDTO dto) {
        ClientDiligenceStatus entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    @Transactional
    public ClientDiligenceStatusDTO update(ClientDiligenceStatusDTO dto) {
        ClientDiligenceStatus entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    @Transactional
    public void delete(String id) {
        repository.findById(id).ifPresent(entity -> {
            entity.setEnabled(false);
            repository.save(entity);
        });
    }
}
