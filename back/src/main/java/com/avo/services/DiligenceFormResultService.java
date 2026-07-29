package com.avo.services;

import lombok.extern.slf4j.Slf4j;
import com.avo.dtos.DiligenceFormResultDTO;
import com.avo.entities.DiligenceFormResult;
import com.avo.mappers.DiligenceFormResultMapper;
import com.avo.repositories.DiligenceFormResultRepository;
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
@Slf4j
public class DiligenceFormResultService {

    private final DiligenceFormResultRepository repository;
    private final DiligenceFormResultMapper mapper;
    private final ClientDiligenceStatusRepository statusRepository;
    private final jakarta.persistence.EntityManager entityManager;

    public Page<DiligenceFormResultDTO> findAll(Pageable pageable) {
        log.info("[ENTER] Executing findAll");
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<DiligenceFormResultDTO> search(Predicate predicate, Pageable pageable) {
        log.info("[ENTER] Executing search");
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public List<DiligenceFormResultDTO> findByClientId(Long clientId) {
        log.info("[ENTER] Executing findByClientId");
        return repository.findByClientId(clientId).stream().map(mapper::toDto).collect(Collectors.toList());
    }

    public DiligenceFormResultDTO findById(String id) {
        log.info("[ENTER] Executing findById");
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    @Transactional
    public DiligenceFormResultDTO create(DiligenceFormResultDTO dto) {
        log.info("[ENTER] Executing create");
        DiligenceFormResult entity = mapper.toEntity(dto);
        if (dto.getUboId() != null) {
            entity.setUbo(entityManager.getReference(com.avo.entities.UBO.class, dto.getUboId()));
        } else {
            entity.setUbo(null);
        }
        if (dto.getClientId() != null) {
            entity.setClient(entityManager.getReference(com.avo.entities.ClientEntity.class, dto.getClientId()));
        } else {
            entity.setClient(null);
        }
        if (dto.getFormConfigId() != null) {
            entity.setFormConfig(entityManager.getReference(com.avo.entities.FormConfig.class, dto.getFormConfigId()));
        } else {
            entity.setFormConfig(null);
        }
        DiligenceFormResult savedResult = repository.save(entity);

        if (dto.getClientId() != null && dto.getFormConfigId() != null) {
            List<com.avo.entities.ClientDiligenceStatus> statuses = statusRepository.findByClientIdAndFormConfigId(dto.getClientId(), dto.getFormConfigId());
            statuses.stream()
                .filter(status -> status.getStatus() == com.avo.entities.DiligenceStatus.PENDING)
                .filter(status -> {
                    if (dto.getUboId() == null) {
                        return status.getUbo() == null;
                    } else {
                        return status.getUbo() != null && status.getUbo().getId().equals(dto.getUboId());
                    }
                })
                .findFirst()
                .ifPresent(status -> {
                    status.setStatus(com.avo.entities.DiligenceStatus.SUBMITTED);
                    status.setResultId(savedResult.getId());
                    statusRepository.save(status);
                });
        }

        return mapper.toDto(savedResult);
    }

    @Transactional
    public DiligenceFormResultDTO update(DiligenceFormResultDTO dto) {
        log.info("[ENTER] Executing update");
        DiligenceFormResult entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    @Transactional
    public void delete(String id) {
        log.info("[ENTER] Executing delete");
        repository.deleteById(id);
    }
}
