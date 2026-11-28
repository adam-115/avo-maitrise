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
    private final com.avo.repositories.StatutDossierRepository statutDossierRepository;
    private final com.avo.repositories.DossierPrioriteRepository dossierPrioriteRepository;
    private final DossierMapper mapper;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    public DossierService(DossierRepository repository, com.avo.repositories.ClientRepository clientRepository,
            com.avo.repositories.StatutDossierRepository statutDossierRepository,
            com.avo.repositories.DossierPrioriteRepository dossierPrioriteRepository,
            DossierMapper mapper, org.springframework.context.ApplicationEventPublisher eventPublisher) {
        this.repository = repository;
        this.clientRepository = clientRepository;
        this.statutDossierRepository = statutDossierRepository;
        this.dossierPrioriteRepository = dossierPrioriteRepository;
        this.mapper = mapper;
        this.eventPublisher = eventPublisher;
    }

    private void linkDocumentsAndParties(Dossier entity) {
        if (entity.getDocuments() != null) {
            entity.getDocuments().forEach(doc -> {
                doc.setDossier(entity);
                if (doc.getClient() == null && entity.getClient() != null && entity.getClient().getId() != null) {
                    clientRepository.findById(entity.getClient().getId()).ifPresent(doc::setClient);
                }
            });
        }
        if (entity.getAutresParties() != null) {
            entity.getAutresParties().forEach(p -> p.setDossier(entity));
        }
    }

    /**
     * Pays de juridiction du dossier (droit applicable utilisé par l'IA) :
     * 1. la valeur saisie, si c'est un pays géré ;
     * 2. sinon la valeur déjà enregistrée (le front peut ne pas renvoyer le champ)
     * ;
     * 3. sinon le pays du client, s'il est géré ;
     * 4. sinon null : « à définir », jamais de France par défaut en silence.
     */
    private void resolvePaysJuridiction(Dossier entity, String previousPays) {
        String pays = com.avo.service.ai.Pays.normalizeOrNull(entity.getPaysJuridiction());
        if (pays == null) {
            pays = com.avo.service.ai.Pays.normalizeOrNull(previousPays);
        }
        if (pays == null && entity.getClient() != null && entity.getClient().getId() != null) {
            pays = clientRepository.findById(entity.getClient().getId())
                    .map(c -> com.avo.service.ai.Pays.normalizeOrNull(c.getPays()))
                    .orElse(null);
        }
        entity.setPaysJuridiction(pays);
    }

    public Page<DossierDTO> findAll(Pageable pageable) {
        log.info("[ENTER] Executing findAll");
        return repository.findAll(pageable).map(mapper::toDto);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public Page<DossierDTO> findAllWithFilters(String searchTerm, String statusFilter, String lawyerFilter,
            Pageable pageable) {
        return findAllWithFilters(searchTerm, statusFilter, lawyerFilter, "ACTIVE", pageable);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public Page<DossierDTO> findAllWithFilters(String searchTerm, String statusFilter, String lawyerFilter,
            String deletedFilter, Pageable pageable) {
        log.info("[ENTER] Executing findAllWithFilters (deletedFilter={})", deletedFilter);
        String effectiveDeletedFilter = (deletedFilter == null || deletedFilter.isBlank()) ? "ACTIVE"
                : deletedFilter.toUpperCase();
        return repository.searchWithFilters(searchTerm, statusFilter, lawyerFilter, effectiveDeletedFilter, pageable)
                .map(this::toListDto);
    }

    /**
     * Projection légère pour la liste paginée (/home/dossier) :
     * évite le problème N+1 Hibernate (ne charge ni documents, ni autresParties, ni
     * intervenantsIds,
     * ni les collections du client, ni les LONGTEXT aiStrategy/aiChatHistory).
     */
    private DossierDTO toListDto(Dossier d) {
        DossierDTO dto = new DossierDTO();
        dto.setId(d.getId());
        dto.setReferenceInterne(d.getReferenceInterne());
        dto.setTitre(d.getTitre());
        dto.setDescription(d.getDescription());
        dto.setDescriptionAudioDocumentId(d.getDescriptionAudioDocumentId());
        dto.setResponsableId(d.getResponsableId());
        dto.setDomaineJuridique(d.getDomaineJuridique());
        dto.setPaysJuridiction(d.getPaysJuridiction());
        dto.setPrioriteID(d.getPrioriteID());
        dto.setStatutID(d.getStatutID());
        dto.setDateOuverture(d.getDateOuverture());
        dto.setDateCloture(d.getDateCloture());
        dto.setUpdated_at(d.getUpdatedAt());
        dto.setDeleted(d.isDeleted());
        dto.setDeletedAt(d.getDeletedAt());
        dto.setDeletedBy(d.getDeletedBy());

        if (d.getClient() != null) {
            com.avo.entities.ClientEntity c = d.getClient();
            com.avo.dtos.ClientEntityDTO cDto = new com.avo.dtos.ClientEntityDTO();
            cDto.setId(c.getId());
            cDto.setType(c.getType());
            cDto.setEmail(c.getEmail());
            cDto.setTelephone(c.getTelephone());
            cDto.setPays(c.getPays());
            cDto.setClientStatus(c.getClientStatus());
            cDto.setDeleted(c.isDeleted());
            cDto.setDeletedAt(c.getDeletedAt());
            cDto.setDeletedBy(c.getDeletedBy());
            if (c instanceof com.avo.entities.ClientPersonnePhysique pp) {
                cDto.setNom(pp.getNom());
                cDto.setPrenom(pp.getPrenom());
            } else if (c instanceof com.avo.entities.ClientMoral cm) {
                cDto.setNomCommercial(cm.getNomCommercial());
            } else if (c instanceof com.avo.entities.Association a) {
                cDto.setNom(a.getNom());
            } else if (c instanceof com.avo.entities.Institution i) {
                cDto.setNom(i.getNom());
            }
            dto.setClient(cDto);
        }
        return dto;
    }

    /**
     * KPIs agrégés en SQL pur (remplace le chargement de 1 000 dossiers côté
     * frontend).
     */
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public java.util.Map<String, Long> getKpis() {
        List<String> closedIds = statutDossierRepository.findAll().stream()
                .filter(s -> {
                    String code = s.getCode() != null ? s.getCode().toUpperCase() : "";
                    return code.equals("CLOS") || code.equals("TERMINE") || code.equals("ARCHIVE");
                })
                .map(s -> String.valueOf(s.getId()))
                .collect(Collectors.toList());
        closedIds.add("CLOS");
        closedIds.add("TERMINE");
        closedIds.add("ARCHIVE");

        List<String> urgentIds = dossierPrioriteRepository.findAll().stream()
                .filter(p -> {
                    String code = p.getCode() != null ? p.getCode().toUpperCase() : "";
                    String label = p.getLabel() != null ? p.getLabel().toUpperCase() : "";
                    return code.contains("URGENT") || label.contains("URGENT");
                })
                .map(p -> String.valueOf(p.getId()))
                .collect(Collectors.toList());
        urgentIds.add("URGENT");
        urgentIds.add("URGENTE");

        java.time.LocalDate firstDay = java.time.LocalDate.now().withDayOfMonth(1);
        java.util.Date start = java.util.Date.from(firstDay.atStartOfDay(java.time.ZoneId.systemDefault()).toInstant());
        java.util.Date end = java.util.Date
                .from(firstDay.plusMonths(1).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant());

        long active = repository.countActiveDossiers(closedIds);
        long urgent = repository.countByPrioriteIDIn(urgentIds);
        long createdThisMonth = repository.countOpenedBetween(start, end);
        long closedThisMonth = repository.countClosedBetween(start, end);
        long totalMonth = createdThisMonth + closedThisMonth;
        long closureRate = totalMonth > 0 ? Math.round((closedThisMonth * 100.0) / totalMonth) : 75L;

        return java.util.Map.of(
                "activeDossiersCount", active,
                "urgentDossiersCount", urgent,
                "createdThisMonthCount", createdThisMonth,
                "closedThisMonthCount", closedThisMonth,
                "closureRate", closureRate);
    }

    public List<DossierDTO> findAll() {
        log.info("[ENTER] Executing findAll");
        return repository.findByDeletedFalse().stream().map(mapper::toDto).collect(Collectors.toList());
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
                throw new IllegalArgumentException(
                        "La référence interne '" + ref + "' est déjà utilisée par un autre dossier.");
            }
            dto.setReferenceInterne(ref);
        }
        Dossier entity = mapper.toEntity(dto);
        linkDocumentsAndParties(entity);
        resolvePaysJuridiction(entity, null);
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
                throw new IllegalArgumentException(
                        "La référence interne '" + ref + "' est déjà utilisée par un autre dossier.");
            }
            dto.setReferenceInterne(ref);
        }
        Dossier existing = dto.getId() == null ? null : repository.findById(dto.getId()).orElse(null);
        String previousPays = existing != null ? existing.getPaysJuridiction() : null;
        Dossier entity = mapper.toEntity(dto);
        if (existing != null) {
            entity.setDeleted(existing.isDeleted());
            entity.setDeletedAt(existing.getDeletedAt());
            entity.setDeletedBy(existing.getDeletedBy());
        }
        linkDocumentsAndParties(entity);
        resolvePaysJuridiction(entity, previousPays);
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

    @org.springframework.transaction.annotation.Transactional
    public DossierDTO updateDescription(Long id, String description, Long descriptionAudioDocumentId) {
        log.info("[ENTER] Executing updateDescription for dossier id: {}", id);
        Dossier dossier = repository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Dossier introuvable avec l'identifiant " + id));
        dossier.setDescription(description);
        dossier.setDescriptionAudioDocumentId(descriptionAudioDocumentId);
        Dossier saved = repository.save(dossier);

        eventPublisher.publishEvent(new com.avo.events.MatterActionEvent(
                this, saved.getId(), getCurrentUsername(), "Mise à jour", "Dossier", saved.getId(),
                descriptionAudioDocumentId != null
                        ? "Description audio et transcription mises à jour"
                        : "Description du dossier mise à jour"));

        return mapper.toDto(saved);
    }

    @org.springframework.transaction.annotation.Transactional
    public void delete(Long id) {
        log.info("[ENTER] Executing soft-delete for dossier id: {}", id);
        Dossier dossier = repository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Dossier introuvable avec l'identifiant " + id));
        dossier.setDeleted(true);
        dossier.setDeletedAt(new java.util.Date());
        dossier.setDeletedBy(getCurrentUsername());
        repository.save(dossier);

        eventPublisher.publishEvent(new com.avo.events.MatterActionEvent(
                this, dossier.getId(), getCurrentUsername(), "Suppression", "Dossier", dossier.getId(),
                "Dossier masqué (suppression logique) : " + dossier.getTitre()));
    }

    @org.springframework.transaction.annotation.Transactional
    public DossierDTO restore(Long id) {
        log.info("[ENTER] Executing restore for dossier id: {}", id);
        Dossier dossier = repository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Dossier introuvable avec l'identifiant " + id));
        dossier.setDeleted(false);
        dossier.setDeletedAt(null);
        dossier.setDeletedBy(null);
        Dossier saved = repository.save(dossier);

        eventPublisher.publishEvent(new com.avo.events.MatterActionEvent(
                this, saved.getId(), getCurrentUsername(), "Restauration", "Dossier", saved.getId(),
                "Dossier restauré : " + saved.getTitre()));

        return mapper.toDto(saved);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public String getDossierContextAsText(Long id) {
        Dossier dossier = repository.findById(id).orElse(null);
        if (dossier == null)
            return "Dossier introuvable.";

        StringBuilder sb = new StringBuilder();
        sb.append("=== DOSSIER #").append(dossier.getId()).append(" ===\n");
        sb.append("Titre : ").append(dossier.getTitre()).append("\n");
        sb.append("Référence : ").append(dossier.getReferenceInterne()).append("\n");
        sb.append("Description : ").append(dossier.getDescription() != null ? dossier.getDescription() : "N/A")
                .append("\n\n");

        if (dossier.getClient() != null) {
            sb.append("=== CLIENT ===\n");
            String nom = "";
            if (dossier.getClient() instanceof com.avo.entities.ClientPersonnePhysique) {
                nom = ((com.avo.entities.ClientPersonnePhysique) dossier.getClient()).getNom();
            } else if (dossier.getClient() instanceof com.avo.entities.ClientMoral) {
                nom = ((com.avo.entities.ClientMoral) dossier.getClient()).getNomCommercial();
            }
            sb.append("Nom : ").append(nom).append("\n");
        }

        return sb.toString();
    }
}
