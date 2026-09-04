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
import com.avo.repositories.DossierRepository;
import com.avo.repositories.UserRepository;
import com.avo.repositories.NoteCategoryRepository;
import com.querydsl.core.types.Predicate;
import com.avo.entities.Dossier;
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
    private final DossierRepository dossierRepository;
    private final UserRepository userRepository;
    private final NoteCategoryRepository noteCategoryRepository;

    public NoteService(NoteRepository repository, 
                       NoteMapper mapper, 
                       org.springframework.context.ApplicationEventPublisher eventPublisher,
                       DossierRepository dossierRepository,
                       UserRepository userRepository,
                       NoteCategoryRepository noteCategoryRepository) {
        this.repository = repository;
        this.mapper = mapper;
        this.eventPublisher = eventPublisher;
        this.dossierRepository = dossierRepository;
        this.userRepository = userRepository;
        this.noteCategoryRepository = noteCategoryRepository;
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
        log.info("[ENTER] Executing create for note: title={}, dossierId={}", dto.getTitle(), dto.getDossierId());
        if (dto.getDossierId() == null) {
            throw new IllegalArgumentException("Le dossierId est obligatoire pour créer une note.");
        }
        Note entity = mapper.toEntity(dto);
        attachRelatedEntities(entity, dto);
        
        if (entity.getDossier() == null) {
            Dossier dossier = dossierRepository.findById(dto.getDossierId())
                    .orElseThrow(() -> new IllegalArgumentException("Dossier introuvable avec l'id: " + dto.getDossierId()));
            entity.setDossier(dossier);
        }

        Note saved = repository.save(entity);
        
        String author = getCurrentUsername();
        Long dossierId = saved.getDossier() != null ? saved.getDossier().getId() : dto.getDossierId();
        eventPublisher.publishEvent(new com.avo.events.MatterActionEvent(
            this, dossierId, author, "Création", "Note", saved.getId(), "Note créée : " + saved.getTitle()
        ));
        
        return mapper.toDto(saved);
    }

    public NoteDTO update(NoteDTO dto) {
        log.info("[ENTER] Executing update for note: id={}, title={}, dossierId={}", dto.getId(), dto.getTitle(), dto.getDossierId());
        if (dto.getId() == null) return null;
        Note existing = repository.findById(dto.getId()).orElse(null);
        if (existing == null) return null;

        existing.setTitle(dto.getTitle());
        existing.setDescription(dto.getDescription());
        attachRelatedEntities(existing, dto);

        Note saved = repository.save(existing);
        
        String author = getCurrentUsername();
        Long dossierId = saved.getDossier() != null ? saved.getDossier().getId() : (dto.getDossierId() != null ? dto.getDossierId() : 0L);
        eventPublisher.publishEvent(new com.avo.events.MatterActionEvent(
            this, dossierId, author, "Modification", "Note", saved.getId(), "Note modifiée : " + saved.getTitle()
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
            dossierRepository.findById(dto.getDossierId()).ifPresent(entity::setDossier);
        }
        if (dto.getAuteurId() != null) {
            try {
                userRepository.findById(dto.getAuteurId()).ifPresent(entity::setAuteur);
            } catch (Exception e) {
                log.warn("Could not attach auteur with id: {}", dto.getAuteurId());
            }
        }
        if (dto.getCategoryId() != null) {
            try {
                noteCategoryRepository.findById(dto.getCategoryId()).ifPresent(entity::setCategory);
            } catch (Exception e) {
                log.warn("Could not attach category with id: {}", dto.getCategoryId());
            }
        }
    }

    public void delete(Long id) {
        log.info("[ENTER] Executing delete");
        repository.findById(id).ifPresent(note -> {
            String author = getCurrentUsername();
            Long dossierId = note.getDossier() != null ? note.getDossier().getId() : 0L;
            eventPublisher.publishEvent(new com.avo.events.MatterActionEvent(
                this, dossierId, author, "Suppression", "Note", note.getId(), "Note supprimée : " + note.getTitle()
            ));
            repository.delete(note);
        });
    }
}
