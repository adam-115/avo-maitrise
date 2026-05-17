package com.avo.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.avo.dtos.AppointementDTO;
import com.avo.entities.Appointement;
import com.avo.mappers.AppointementMapper;
import com.avo.repositories.AppointementRepository;
import com.querydsl.core.types.Predicate;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import com.avo.entities.Dossier;
import com.avo.entities.ClientEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@Service
@Transactional
public class AppointementService {

    private final AppointementRepository repository;
    private final AppointementMapper mapper;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    @PersistenceContext
    private EntityManager entityManager;

    public AppointementService(AppointementRepository repository, AppointementMapper mapper, org.springframework.context.ApplicationEventPublisher eventPublisher) {
        this.repository = repository;
        this.mapper = mapper;
        this.eventPublisher = eventPublisher;
    }

    public Page<AppointementDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<AppointementDTO> search(Predicate predicate, Pageable pageable) {
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public AppointementDTO findById(Long id) {
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public AppointementDTO create(AppointementDTO dto) {
        Appointement entity = mapper.toEntity(dto);
        attachRelatedEntities(entity, dto);
        Appointement saved = repository.save(entity);
        
        if (saved.getDossier() != null) {
            String author = getCurrentUsername();
            eventPublisher.publishEvent(new com.avo.events.MatterActionEvent(
                this, saved.getDossier().getId(), author, "Création", "Audience", saved.getId(), "Audience planifiée : " + saved.getTitle()
            ));
        }
        
        return mapper.toDto(saved);
    }

    public AppointementDTO update(AppointementDTO dto) {
        if (dto.getId() == null) return null;
        Appointement existing = repository.findById(dto.getId()).orElse(null);
        if (existing == null) return null;

        existing.setTitle(dto.getTitle());
        existing.setClientCase(dto.getClientCase());
        existing.setTime(dto.getTime());
        existing.setEndTime(dto.getEndTime());
        existing.setLocation(dto.getLocation());
        existing.setStatus(dto.getStatus());
        existing.setDate(dto.getDate());
        attachRelatedEntities(existing, dto);

        Appointement saved = repository.save(existing);
        
        if (saved.getDossier() != null) {
            String author = getCurrentUsername();
            eventPublisher.publishEvent(new com.avo.events.MatterActionEvent(
                this, saved.getDossier().getId(), author, "Modification", "Audience", saved.getId(), "Audience modifiée : " + saved.getTitle()
            ));
        }

        return mapper.toDto(saved);
    }

    public void delete(Long id) {
        repository.findById(id).ifPresent(entity -> {
            if (entity.getDossier() != null) {
                String author = getCurrentUsername();
                eventPublisher.publishEvent(new com.avo.events.MatterActionEvent(
                    this, entity.getDossier().getId(), author, "Suppression", "Audience", entity.getId(), "Audience supprimée : " + entity.getTitle()
                ));
            }
            repository.delete(entity);
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

    private void attachRelatedEntities(Appointement entity, AppointementDTO dto) {
        if (dto.getDossierId() != null) {
            entity.setDossier(entityManager.getReference(Dossier.class, dto.getDossierId()));
        } else {
            entity.setDossier(null);
        }
        if (dto.getClientId() != null) {
            entity.setClient(entityManager.getReference(ClientEntity.class, dto.getClientId()));
        } else {
            entity.setClient(null);
        }
    }
}
