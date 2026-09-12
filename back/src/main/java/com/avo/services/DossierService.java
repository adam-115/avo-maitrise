package com.avo.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import com.avo.config.SecurityUtils;
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
    private final SecurityUtils securityUtils;

    public DossierService(DossierRepository repository,
                          com.avo.repositories.ClientRepository clientRepository,
                          DossierMapper mapper,
                          org.springframework.context.ApplicationEventPublisher eventPublisher,
                          SecurityUtils securityUtils) {
        this.repository = repository;
        this.clientRepository = clientRepository;
        this.mapper = mapper;
        this.eventPublisher = eventPublisher;
        this.securityUtils = securityUtils;
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
        if (!securityUtils.canViewAllDossiers()) {
            List<String> userIds = securityUtils.getCurrentUserIdentifiers();
            return repository.findAllScoped(true, userIds, pageable).map(mapper::toDto);
        }
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<DossierDTO> findAllWithFilters(String searchTerm, String statusFilter, String lawyerFilter, Pageable pageable) {
        log.info("[ENTER] Executing findAllWithFilters");
        boolean enforceScope = !securityUtils.canViewAllDossiers();
        List<String> userIds = enforceScope ? securityUtils.getCurrentUserIdentifiers() : List.of("__NONE__");
        return repository.searchWithFilters(searchTerm, statusFilter, lawyerFilter, enforceScope, userIds, pageable).map(mapper::toDto);
    }

    public List<DossierDTO> findAll() {
        log.info("[ENTER] Executing findAll");
        if (!securityUtils.canViewAllDossiers()) {
            List<String> userIds = securityUtils.getCurrentUserIdentifiers();
            return repository.findAllScoped(true, userIds).stream().map(mapper::toDto).collect(Collectors.toList());
        }
        return repository.findAll().stream().map(mapper::toDto).collect(Collectors.toList());
    }

    public Page<DossierDTO> search(Predicate predicate, Pageable pageable) {
        log.info("[ENTER] Executing search");
        com.querydsl.core.BooleanBuilder builder = new com.querydsl.core.BooleanBuilder();
        if (predicate != null) {
            builder.and(predicate);
        }
        com.querydsl.core.types.dsl.BooleanExpression scope = securityUtils.getDossierScopeExpression();
        if (scope != null) {
            builder.and(scope);
        }
        return repository.findAll(builder, pageable).map(mapper::toDto);
    }

    public DossierDTO findById(Long id) {
        log.info("[ENTER] Executing findById for dossier id: {}", id);
        Dossier dossier = repository.findById(id).orElse(null);
        if (dossier != null && !securityUtils.isDossierAllowedForUser(dossier)) {
            log.warn("[SECURITY] Accès non autorisé au dossier {} par l'utilisateur {}", id, securityUtils.getCurrentUsername());
            throw new AccessDeniedException("Accès refusé : vous n'avez pas les droits pour consulter ce dossier.");
        }
        return dossier != null ? mapper.toDto(dossier) : null;
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

        // Attribution automatique du créateur
        if (dto.getCreatedBy() == null || dto.getCreatedBy().isBlank()) {
            dto.setCreatedBy(securityUtils.getCurrentUsername());
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
        if (dto.getId() != null && !securityUtils.canAccessDossier(dto.getId())) {
            log.warn("[SECURITY] Tentative de modification non autorisée du dossier {} par {}", dto.getId(), securityUtils.getCurrentUsername());
            throw new AccessDeniedException("Accès refusé : vous n'avez pas les droits pour modifier ce dossier.");
        }

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
        return securityUtils.getCurrentUsername() != null ? securityUtils.getCurrentUsername() : "Système";
    }

    public void delete(Long id) {
        log.info("[ENTER] Executing delete");
        if (id != null && !securityUtils.canAccessDossier(id)) {
            log.warn("[SECURITY] Tentative de suppression non autorisée du dossier {} par {}", id, securityUtils.getCurrentUsername());
            throw new AccessDeniedException("Accès refusé : vous n'avez pas les droits pour supprimer ce dossier.");
        }
        repository.deleteById(id);
    }
}

