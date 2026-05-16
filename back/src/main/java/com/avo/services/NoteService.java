package com.avo.services;

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
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class NoteService {

    private final NoteRepository repository;
    private final NoteMapper mapper;

    @PersistenceContext
    private EntityManager entityManager;

    public NoteService(NoteRepository repository, NoteMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<NoteDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<NoteDTO> search(Predicate predicate, Pageable pageable) {
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public NoteDTO findById(Long id) {
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public List<NoteDTO> findByDossierId(Long dossierId) {
        return repository.findByDossier_Id(dossierId).stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    public NoteDTO create(NoteDTO dto) {
        Note entity = mapper.toEntity(dto);
        attachRelatedEntities(entity, dto);
        return mapper.toDto(repository.save(entity));
    }

    public NoteDTO update(NoteDTO dto) {
        if (dto.getId() == null) return null;
        Note existing = repository.findById(dto.getId()).orElse(null);
        if (existing == null) return null;

        existing.setTitle(dto.getTitle());
        existing.setDescription(dto.getDescription());
        attachRelatedEntities(existing, dto);

        return mapper.toDto(repository.save(existing));
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
        repository.deleteById(id);
    }
}
