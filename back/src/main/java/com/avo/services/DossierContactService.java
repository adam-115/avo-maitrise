package com.avo.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.avo.dtos.DossierContactDTO;
import com.avo.entities.DossierContact;
import com.avo.entities.Dossier;
import com.avo.mappers.DossierContactMapper;
import com.avo.repositories.DossierContactRepository;
import com.avo.repositories.DossierRepository;
import com.querydsl.core.types.Predicate;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
public class DossierContactService {

    private final DossierContactRepository repository;
    private final DossierRepository dossierRepository;
    private final DossierContactMapper mapper;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    @PersistenceContext
    private EntityManager entityManager;

    public DossierContactService(DossierContactRepository repository, 
                                 DossierRepository dossierRepository, 
                                 DossierContactMapper mapper, 
                                 org.springframework.context.ApplicationEventPublisher eventPublisher) {
        this.repository = repository;
        this.dossierRepository = dossierRepository;
        this.mapper = mapper;
        this.eventPublisher = eventPublisher;
    }

    public Page<DossierContactDTO> findAll(Pageable pageable) {
        log.info("[ENTER] Executing findAll");
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<DossierContactDTO> search(Predicate predicate, Pageable pageable) {
        log.info("[ENTER] Executing search");
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public DossierContactDTO findById(Long id) {
        log.info("[ENTER] Executing findById");
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public List<DossierContactDTO> findByDossierId(Long dossierId) {
        log.info("[ENTER] Executing findByDossierId");
        return repository.findByDossier_Id(dossierId).stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    public DossierContactDTO create(DossierContactDTO dto) {
        log.info("[ENTER] Executing create");
        DossierContact entity = mapper.toEntity(dto);
        attachRelatedEntities(entity, dto);
        DossierContact saved = repository.save(entity);
        
        eventPublisher.publishEvent(new com.avo.events.MatterActionEvent(
            this, saved.getDossier().getId(), getCurrentUsername(), "Ajout", "Contact", saved.getId(), "Contact ajouté : " + saved.getNom() + " " + saved.getPrenom()
        ));
        
        return mapper.toDto(saved);
    }

    public DossierContactDTO update(DossierContactDTO dto) {
        log.info("[ENTER] Executing update");
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
        DossierContact saved = repository.save(existing);

        eventPublisher.publishEvent(new com.avo.events.MatterActionEvent(
            this, saved.getDossier().getId(), getCurrentUsername(), "Mise à jour", "Contact", saved.getId(), "Contact mis à jour : " + saved.getNom() + " " + saved.getPrenom()
        ));

        return mapper.toDto(saved);
    }

    private String getCurrentUsername() {
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null) return auth.getName();
        } catch (Exception e) {}
        return "Système";
    }

    private void attachRelatedEntities(DossierContact entity, DossierContactDTO dto) {
        if (dto.getDossierId() == null) {
            throw new IllegalArgumentException("Dossier ID is required to link a contact.");
        }
        Dossier dossier = dossierRepository.findById(dto.getDossierId())
            .orElseThrow(() -> new RuntimeException("Dossier not found"));
        entity.setDossier(dossier);
    }

    public void delete(Long id) {
        log.info("[ENTER] Executing delete");
        repository.findById(id).ifPresent(contact -> {
            eventPublisher.publishEvent(new com.avo.events.MatterActionEvent(
                this, contact.getDossier().getId(), getCurrentUsername(), "Suppression", "Contact", contact.getId(), "Contact supprimé : " + contact.getNom() + " " + contact.getPrenom()
            ));
            repository.delete(contact);
        });
    }
}
