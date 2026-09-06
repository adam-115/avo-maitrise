package com.avo.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.avo.dtos.DossierDTO;
import com.avo.entities.Dossier;
import com.avo.mappers.DossierMapper;
import com.avo.repositories.DossierRepository;
import com.querydsl.core.types.Predicate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class DossierService {

    private final DossierRepository repository;
    private final com.avo.repositories.ClientRepository clientRepository;
    private final DossierMapper mapper;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    public DossierService(DossierRepository repository, com.avo.repositories.ClientRepository clientRepository,
            DossierMapper mapper, org.springframework.context.ApplicationEventPublisher eventPublisher) {
        this.repository = repository;
        this.clientRepository = clientRepository;
        this.mapper = mapper;
        this.eventPublisher = eventPublisher;
    }

    private void linkDocuments(Dossier entity) {
        if (entity.getDocuments() != null) {
            entity.getDocuments().forEach(doc -> {
                doc.setDossier(entity);
                if (doc.getClient() == null && entity.getClient() != null && entity.getClient().getId() != null) {
                    clientRepository.findById(entity.getClient().getId()).ifPresent(doc::setClient);
                }
            });
        }
    }

    public Page<DossierDTO> findAll(Pageable pageable) {
        log.info("[ENTER] Executing findAll");
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<DossierDTO> findAllWithFilters(String searchTerm, String statusFilter, String lawyerFilter, Pageable pageable) {
        log.info("[ENTER] Executing findAllWithFilters");
        return repository.searchWithFilters(searchTerm, statusFilter, lawyerFilter, pageable).map(mapper::toDto);
    }

    public List<DossierDTO> findAll() {
        log.info("[ENTER] Executing findAll");
        return repository.findAll().stream().map(mapper::toDto).collect(Collectors.toList());
    }

    public Page<DossierDTO> search(Predicate predicate, Pageable pageable) {
        log.info("[ENTER] Executing search");
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public DossierDTO findById(Long id) {
        log.info("[ENTER] Executing findById");
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public DossierDTO create(DossierDTO dto) {
        log.info("[ENTER] Executing create");
        if (dto.getReferenceInterne() != null && !dto.getReferenceInterne().trim().isEmpty()) {
            String ref = dto.getReferenceInterne().trim();
            if (repository.existsByReferenceInterne(ref)) {
                throw new IllegalArgumentException("La référence interne '" + ref + "' est déjà utilisée par un autre dossier.");
            }
            dto.setReferenceInterne(ref);
        }
        Dossier entity = mapper.toEntity(dto);
        linkDocuments(entity);
        Dossier saved = repository.save(entity);

        eventPublisher.publishEvent(new com.avo.events.MatterActionEvent(
                this, saved.getId(), getCurrentUsername(), "Création", "Dossier", saved.getId(),
                "Nouveau dossier créé : " + saved.getTitre()));

        return mapper.toDto(saved);
    }

    public DossierDTO update(DossierDTO dto) {
        log.info("[ENTER] Executing update");
        if (dto.getReferenceInterne() != null && !dto.getReferenceInterne().trim().isEmpty() && dto.getId() != null) {
            String ref = dto.getReferenceInterne().trim();
            if (repository.existsByReferenceInterneAndIdNot(ref, dto.getId())) {
                throw new IllegalArgumentException("La référence interne '" + ref + "' est déjà utilisée par un autre dossier.");
            }
            dto.setReferenceInterne(ref);
        }
        Dossier entity = mapper.toEntity(dto);
        linkDocuments(entity);
        Dossier saved = repository.save(entity);

        if (saved.getDocuments().size() > dto.getDocuments().size()) {
            for (int i = dto.getDocuments().size(); i < saved.getDocuments().size(); i++) {
                eventPublisher.publishEvent(new com.avo.events.MatterActionEvent(
                        this, saved.getId(), getCurrentUsername(), "Ajout", "Document",
                        saved.getDocuments().get(i).getId(),
                        "Document ajouté : " + saved.getDocuments().get(i).getNomFichier()));
            }
        } else {
            eventPublisher.publishEvent(new com.avo.events.MatterActionEvent(
                    this, saved.getId(), getCurrentUsername(), "Mise à jour", "Dossier", saved.getId(),
                    "Dossier mis à jour : " + saved.getTitre()));
        }

        return mapper.toDto(saved);
    }

    private String getCurrentUsername() {
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            if (auth != null)
                return auth.getName();
        } catch (Exception e) {
        }
        return "Système";
    }

    public void delete(Long id) {
        log.info("[ENTER] Executing delete");
        repository.deleteById(id);
    }
}
