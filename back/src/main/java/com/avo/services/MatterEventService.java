package com.avo.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.avo.dtos.MatterEventDTO;
import com.avo.entities.MatterEvent;
import com.avo.mappers.MatterEventMapper;
import com.avo.repositories.MatterEventRepository;
import com.querydsl.core.types.Predicate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class MatterEventService {

    private final MatterEventRepository repository;
    private final MatterEventMapper mapper;
    private final MatterActivityService activityService;

    public MatterEventService(MatterEventRepository repository, MatterEventMapper mapper, MatterActivityService activityService) {
        this.repository = repository;
        this.mapper = mapper;
        this.activityService = activityService;
    }

    public Page<MatterEventDTO> findAll(Pageable pageable) {
        log.info("[ENTER] Executing findAll");
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public List<MatterEventDTO> findAll() {
        log.info("[ENTER] Executing findAll");
        return repository.findAll().stream().map(mapper::toDto).collect(Collectors.toList());
    }

    public Page<MatterEventDTO> search(Predicate predicate, Pageable pageable) {
        log.info("[ENTER] Executing search");
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public MatterEventDTO findById(Long id) {
        log.info("[ENTER] Executing findById");
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public MatterEventDTO create(MatterEventDTO dto) {
        log.info("[ENTER] Executing create");
        MatterEvent entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public MatterEventDTO update(MatterEventDTO dto) {
        log.info("[ENTER] Executing update");
        MatterEvent entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public void delete(Long id) {
        log.info("[ENTER] Executing delete");
        repository.findById(id).ifPresent(event -> {
            String author = getCurrentUsername();
            activityService.logActivity(
                event.getDossierId(),
                author,
                "Suppression",
                "Événement",
                event.getId(),
                "Événement supprimé : " + event.getTitre()
            );
            repository.delete(event);
        });
    }

    private String getCurrentUsername() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null) {
                return authentication.getName();
            }
        } catch (Exception e) {
            // Fallback
        }
        return "Système";
    }
}
