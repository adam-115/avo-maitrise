package com.avo.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.avo.dtos.DossierContactDTO;
import com.avo.entities.DossierContact;
import com.avo.entities.Dossier;
import com.avo.mappers.DossierContactMapper;
import com.avo.repositories.DossierContactRepository;
import com.querydsl.core.types.Predicate;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class DossierContactService {

    private final DossierContactRepository repository;
    private final DossierContactMapper mapper;

    @PersistenceContext
    private EntityManager entityManager;

    public DossierContactService(DossierContactRepository repository, DossierContactMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<DossierContactDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<DossierContactDTO> search(Predicate predicate, Pageable pageable) {
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public DossierContactDTO findById(Long id) {
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public List<DossierContactDTO> findByDossierId(Long dossierId) {
        return repository.findByDossier_Id(dossierId).stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    public DossierContactDTO create(DossierContactDTO dto) {
        DossierContact entity = mapper.toEntity(dto);
        attachRelatedEntities(entity, dto);
        return mapper.toDto(repository.save(entity));
    }

    public DossierContactDTO update(DossierContactDTO dto) {
        if (dto.getId() == null) return null;
        DossierContact existing = repository.findById(dto.getId()).orElse(null);
        if (existing == null) return null;

        // Patch fields
        existing.setCivilite(dto.getCivilite());
        existing.setNom(dto.getNom());
        existing.setPrenom(dto.getPrenom());
        existing.setEntreprise(dto.getEntreprise());
        existing.setEmail(dto.getEmail());
        existing.setTelephoneFixe(dto.getTelephoneFixe());
        existing.setTelephoneMobile(dto.getTelephoneMobile());
        existing.setAdresse(dto.getAdresse());
        existing.setNumToque(dto.getNumToque());
        existing.setSiteWeb(dto.getSiteWeb());
        existing.setNotes(dto.getNotes());

        attachRelatedEntities(existing, dto);
        return mapper.toDto(repository.save(existing));
    }

    private void attachRelatedEntities(DossierContact entity, DossierContactDTO dto) {
        if (dto.getDossierId() != null) {
            entity.setDossier(entityManager.getReference(Dossier.class, dto.getDossierId()));
        }
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
