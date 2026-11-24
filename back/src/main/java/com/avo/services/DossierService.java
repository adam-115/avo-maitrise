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
     * 2. sinon la valeur déjà enregistrée (le front peut ne pas renvoyer le champ) ;
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
    public Page<DossierDTO> findAllWithFilters(String searchTerm, String statusFilter, String lawyerFilter, Pageable pageable) {
        log.info("[ENTER] Executing findAllWithFilters");
        return repository.searchWithFilters(searchTerm, statusFilter, lawyerFilter, pageable).map(this::toListDto);
    }

    /**
     * Projection légère pour la liste paginée (/home/dossier) :
     * évite le problème N+1 Hibernate (ne charge ni documents, ni autresParties, ni intervenantsIds,
     * ni les collections du client, ni les LONGTEXT aiStrategy/aiChatHistory).
     */
    private DossierDTO toListDto(Dossier d) {
        DossierDTO dto = new DossierDTO();
        dto.setId(d.getId());
        dto.setReferenceInterne(d.getReferenceInterne());
        dto.setTitre(d.getTitre());
        dto.setDescription(d.getDescription());
        dto.setResponsableId(d.getResponsableId());
        dto.setDomaineJuridique(d.getDomaineJuridique());
        dto.setPaysJuridiction(d.getPaysJuridiction());
        dto.setPrioriteID(d.getPrioriteID());
        dto.setStatutID(d.getStatutID());
        dto.setDateOuverture(d.getDateOuverture());
        dto.setDateCloture(d.getDateCloture());
        dto.setUpdated_at(d.getUpdatedAt());

        if (d.getClient() != null) {
            com.avo.entities.ClientEntity c = d.getClient();
            com.avo.dtos.ClientEntityDTO cDto = new com.avo.dtos.ClientEntityDTO();
            cDto.setId(c.getId());
            cDto.setType(c.getType());
            cDto.setEmail(c.getEmail());
            cDto.setTelephone(c.getTelephone());
            cDto.setPays(c.getPays());
            cDto.setClientStatus(c.getClientStatus());
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

    /** KPIs agrégés en SQL pur (remplace le chargement de 1 000 dossiers côté frontend). */
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
        java.util.Date end = java.util.Date.from(firstDay.plusMonths(1).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant());

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
                "closureRate", closureRate
        );
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
                throw new IllegalArgumentException("La référence interne '" + ref + "' est déjà utilisée par un autre dossier.");
            }
            dto.setReferenceInterne(ref);
        }
        String previousPays = dto.getId() == null ? null
                : repository.findById(dto.getId()).map(Dossier::getPaysJuridiction).orElse(null);
        Dossier entity = mapper.toEntity(dto);
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

    public void delete(Long id) {
        log.info("[ENTER] Executing delete");
        repository.deleteById(id);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public String getDossierContextAsText(Long id) {
        Dossier dossier = repository.findById(id).orElse(null);
        if (dossier == null) return "Dossier introuvable.";
        
        StringBuilder sb = new StringBuilder();
        sb.append("=== DOSSIER #").append(dossier.getId()).append(" ===\n");
        sb.append("Titre : ").append(dossier.getTitre()).append("\n");
        sb.append("Référence : ").append(dossier.getReferenceInterne()).append("\n");
        sb.append("Description : ").append(dossier.getDescription() != null ? dossier.getDescription() : "N/A").append("\n\n");
        
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
