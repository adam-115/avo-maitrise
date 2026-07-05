package com.avo.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.avo.dtos.NoteDTO;
import com.avo.entities.Note;
import com.avo.mappers.NoteMapper;
import com.avo.repositories.NoteRepository;
import com.querydsl.core.types.Predicate;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import com.avo.entities.Dossier;
import com.avo.entities.AppUser;
import com.avo.entities.NoteCategory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
public class NoteService {

    private final NoteRepository repository;
    private final NoteMapper mapper;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    @PersistenceContext
    private EntityManager entityManager;

    public NoteService(NoteRepository repository, NoteMapper mapper, org.springframework.context.ApplicationEventPublisher eventPublisher) {
        this.repository = repository;
        this.mapper = mapper;
        this.eventPublisher = eventPublisher;
    }

    public Page<NoteDTO> findAll(Pageable pageable) {
        log.info("[ENTER] Executing findAll");
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<NoteDTO> search(Predicate predicate, Pageable pageable) {
        log.info("[ENTER] Executing search");
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public NoteDTO findById(Long id) {
        log.info("[ENTER] Executing findById");
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public List<NoteDTO> findByDossierId(Long dossierId) {
        log.info("[ENTER] Executing findByDossierId");
        return repository.findByDossier_Id(dossierId).stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    public NoteDTO create(NoteDTO dto) {
        log.info("[ENTER] Executing create");
        Note entity = mapper.toEntity(dto);
        attachRelatedEntities(entity, dto);
        Note saved = repository.save(entity);
        
        String author = getCurrentUsername();
        eventPublisher.publishEvent(new com.avo.events.MatterActionEvent(
            this, saved.getDossier().getId(), author, "Création", "Note", saved.getId(), "Note créée : " + saved.getTitle()
        ));
        
        return mapper.toDto(saved);
    }

    public NoteDTO update(NoteDTO dto) {
        log.info("[ENTER] Executing update");
        if (dto.getId() == null) return null;
        Note existing = repository.findById(dto.getId()).orElse(null);
        if (existing == null) return null;

        existing.setTitle(dto.getTitle());
        existing.setDescription(dto.getDescription());
        attachRelatedEntities(existing, dto);

        Note saved = repository.save(existing);
        
        String author = getCurrentUsername();
        eventPublisher.publishEvent(new com.avo.events.MatterActionEvent(
            this, saved.getDossier().getId(), author, "Modification", "Note", saved.getId(), "Note modifiée : " + saved.getTitle()
        ));

        return mapper.toDto(saved);
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

    private void attachRelatedEntities(Note entity, NoteDTO dto) {
        if (dto.getDossierId() != null) {
            entity.setDossier(entityManager.getReference(Dossier.class, dto.getDossierId()));
        }
        if (dto.getAuteurId() != null) {
            entity.setAuteur(entityManager.getReference(AppUser.class, dto.getAuteurId()));
        }
        if (dto.getCategoryId() != null) {
            entity.setCategory(entityManager.getReference(NoteCategory.class, dto.getCategoryId()));
        }
    }

    public void delete(Long id) {
        log.info("[ENTER] Executing delete");
        repository.findById(id).ifPresent(note -> {
            String author = getCurrentUsername();
            eventPublisher.publishEvent(new com.avo.events.MatterActionEvent(
                this, note.getDossier().getId(), author, "Suppression", "Note", note.getId(), "Note supprimée : " + note.getTitle()
            ));
            repository.delete(note);
        });
    }
}
