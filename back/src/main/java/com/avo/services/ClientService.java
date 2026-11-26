package com.avo.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.avo.dtos.ClientEntityDTO;
import com.avo.entities.ClientEntity;
import com.avo.mappers.ClientEntityMapper;
import com.avo.repositories.ClientRepository;
import com.querydsl.core.types.Predicate;

@Service
@Slf4j
public class ClientService {

    private final ClientRepository repository;
    private final ClientEntityMapper mapper;
    private final com.avo.repositories.ScreeningMatchRepository screeningMatchRepository;
    private final com.avo.repositories.ScreeningExecutionRepository screeningExecutionRepository;
    private final com.avo.repositories.DossierRepository dossierRepository;

    public ClientService(ClientRepository repository, 
                         ClientEntityMapper mapper, 
                         com.avo.repositories.ScreeningMatchRepository screeningMatchRepository,
                         com.avo.repositories.ScreeningExecutionRepository screeningExecutionRepository,
                         com.avo.repositories.DossierRepository dossierRepository) {
        this.repository = repository;
        this.mapper = mapper;
        this.screeningMatchRepository = screeningMatchRepository;
        this.screeningExecutionRepository = screeningExecutionRepository;
        this.dossierRepository = dossierRepository;
    }

    public Page<ClientEntityDTO> findAll(Pageable pageable) {
        log.info("[ENTER] Executing findAll");
        return repository.findByDeletedFalse(pageable).map(mapper::toDto);
    }

    public Page<ClientEntityDTO> findAllWithFilters(String searchTerm, String type, com.avo.entities.ClientStatus status, String risk, Pageable pageable) {
        return findAllWithFilters(searchTerm, type, status, risk, "ACTIVE", pageable);
    }

    public Page<ClientEntityDTO> findAllWithFilters(String searchTerm, String type, com.avo.entities.ClientStatus status, String risk, String deletedFilter, Pageable pageable) {
        log.info("[ENTER] Executing findAllWithFilters (deletedFilter={})", deletedFilter);
        String effectiveDeletedFilter = (deletedFilter == null || deletedFilter.isBlank()) ? "ACTIVE" : deletedFilter.toUpperCase();
        return repository.searchWithFilters(searchTerm, type, status, risk, effectiveDeletedFilter, pageable).map(mapper::toDto);
    }

    public long countActiveDossiers(Long clientId) {
        return dossierRepository.countByClientIdAndDeletedFalse(clientId);
    }

    public Page<ClientEntityDTO> search(Predicate predicate, Pageable pageable) {
        log.info("[ENTER] Executing search");
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public ClientEntityDTO findById(Long id) {
        log.info("[ENTER] Executing findById");
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public ClientEntityDTO create(ClientEntityDTO dto) {
        log.info("[ENTER] Executing create");
        ClientEntity entity = mapper.toEntity(dto);
        entity.linkChildren();
        return mapper.toDto(repository.save(entity));
    }

    @org.springframework.transaction.annotation.Transactional
    public ClientEntityDTO update(ClientEntityDTO dto) {
        log.info("[ENTER] Executing update for client id: {}", dto.getId());
        ClientEntity existing = repository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Client not found"));

        if (existing instanceof com.avo.entities.ClientMoral && dto instanceof com.avo.dtos.ClientMoralDTO) {
            com.avo.entities.ClientMoral cm = (com.avo.entities.ClientMoral) existing;
            com.avo.dtos.ClientMoralDTO cmDto = (com.avo.dtos.ClientMoralDTO) dto;
            if (cm.getUbos() != null && cmDto.getUbos() != null) {
                java.util.Set<Long> incomingUboIds = cmDto.getUbos().stream()
                        .map(u -> u.getId())
                        .filter(java.util.Objects::nonNull)
                        .collect(java.util.stream.Collectors.toSet());
                for (com.avo.entities.UBO u : cm.getUbos()) {
                    if (u.getId() != null && !incomingUboIds.contains(u.getId())) {
                        screeningMatchRepository.deleteByUboId(u.getId());
                        screeningExecutionRepository.deleteByUboId(u.getId());
                    }
                }
            }
        }

        ClientEntity incoming = mapper.toEntity(dto);

        if (existing instanceof com.avo.entities.ClientPersonnePhysique && incoming instanceof com.avo.entities.ClientPersonnePhysique) {
            ((com.avo.entities.ClientPersonnePhysique) existing).updateFieldsFrom((com.avo.entities.ClientPersonnePhysique) incoming);
        } else if (existing instanceof com.avo.entities.ClientMoral && incoming instanceof com.avo.entities.ClientMoral) {
            ((com.avo.entities.ClientMoral) existing).updateFieldsFrom((com.avo.entities.ClientMoral) incoming);
        } else if (existing instanceof com.avo.entities.Association && incoming instanceof com.avo.entities.Association) {
            ((com.avo.entities.Association) existing).updateFieldsFrom((com.avo.entities.Association) incoming);
        } else if (existing instanceof com.avo.entities.Institution && incoming instanceof com.avo.entities.Institution) {
            ((com.avo.entities.Institution) existing).updateFieldsFrom((com.avo.entities.Institution) incoming);
        } else {
            existing.updateBasicFieldsFrom(incoming);
        }

        // Incrémentation explicite de la version des données d'identité du client
        existing.setVersion((existing.getVersion() != null ? existing.getVersion() : 1L) + 1L);

        existing.linkChildren();
        return mapper.toDto(repository.save(existing));
    }
    
    @org.springframework.transaction.annotation.Transactional
    public void delete(Long id) {
        delete(id, false);
    }

    @org.springframework.transaction.annotation.Transactional
    public void delete(Long id, boolean deleteDossiers) {
        log.info("[ENTER] Executing soft-delete for client id: {} (deleteDossiers={})", id, deleteDossiers);
        ClientEntity client = repository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Client introuvable avec l'identifiant " + id));
        java.util.Date now = new java.util.Date();
        String user = getCurrentUsername();
        client.setDeleted(true);
        client.setDeletedAt(now);
        client.setDeletedBy(user);
        repository.save(client);

        if (deleteDossiers) {
            java.util.List<com.avo.entities.Dossier> activeDossiers = dossierRepository.findByClientIdAndDeletedFalse(id);
            for (com.avo.entities.Dossier d : activeDossiers) {
                d.setDeleted(true);
                d.setDeletedAt(now);
                d.setDeletedBy(user);
            }
            if (!activeDossiers.isEmpty()) {
                dossierRepository.saveAll(activeDossiers);
            }
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public ClientEntityDTO restore(Long id, boolean restoreDossiers) {
        log.info("[ENTER] Executing restore for client id: {} (restoreDossiers={})", id, restoreDossiers);
        ClientEntity client = repository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Client introuvable avec l'identifiant " + id));
        client.setDeleted(false);
        client.setDeletedAt(null);
        client.setDeletedBy(null);
        ClientEntity saved = repository.save(client);

        if (restoreDossiers) {
            java.util.List<com.avo.entities.Dossier> deletedDossiers = dossierRepository.findByClientIdAndDeletedTrue(id);
            for (com.avo.entities.Dossier d : deletedDossiers) {
                d.setDeleted(false);
                d.setDeletedAt(null);
                d.setDeletedBy(null);
            }
            if (!deletedDossiers.isEmpty()) {
                dossierRepository.saveAll(deletedDossiers);
            }
        }
        return mapper.toDto(saved);
    }

    private String getCurrentUsername() {
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
                return auth.getName();
            }
        } catch (Exception ignored) {}
        return "Système";
    }

    public ClientEntityDTO updateStatus(Long id, com.avo.entities.ClientStatus status) {
        log.info("[ENTER] Executing updateStatus for client id: {}, new status: {}", id, status);
        ClientEntity entity = repository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Client introuvable avec l'identifiant " + id));

        // Règle de conformité LCB-FT : Contrôle préalable des alertes de criblage (sur le dernier état de chaque cible)
        java.util.List<com.avo.entities.ScreeningMatch> allMatches = screeningMatchRepository.findByClientId(id);
        java.util.Map<String, com.avo.entities.ScreeningMatch> latestByTarget = new java.util.HashMap<>();
        for (com.avo.entities.ScreeningMatch m : allMatches) {
            String key = m.getYenteId() != null ? m.getYenteId() : String.valueOf(m.getId());
            com.avo.entities.ScreeningMatch existing = latestByTarget.get(key);
            if (existing == null || (m.getCreatedAt() != null && existing.getCreatedAt() != null && m.getCreatedAt().isAfter(existing.getCreatedAt())) || (m.getId() != null && existing.getId() != null && m.getId() > existing.getId())) {
                latestByTarget.put(key, m);
            }
        }

        long pendingCount = latestByTarget.values().stream()
                .filter(m -> m.getStatus() == null || m.getStatus() == com.avo.entities.ScreeningMatchStatus.PENDING)
                .count();

        boolean hasActiveSanction = latestByTarget.values().stream()
                .anyMatch(m -> m.getStatus() == com.avo.entities.ScreeningMatchStatus.TRUE_POSITIVE 
                            || m.getStatus() == com.avo.entities.ScreeningMatchStatus.TRUE_POSITIVE_SANCTION);

        // 1. Si des alertes sont encore non traitées (PENDING), interdire la validation du client
        if (pendingCount > 0 && (status == com.avo.entities.ClientStatus.AML_VALIDATED || status == com.avo.entities.ClientStatus.VALIDATED)) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST,
                "Impossible de valider manuellement le statut : " + pendingCount + " alerte(s) de conformité sont encore en attente d'analyse (PENDING). Veuillez qualifier toutes les correspondances avant de valider le dossier."
            );
        }

        // 2. Si le client fait l'objet d'une sanction confirmée, interdire le statut VALIDÉ / AML_VALIDATED
        if (hasActiveSanction && (status == com.avo.entities.ClientStatus.AML_VALIDATED || status == com.avo.entities.ClientStatus.VALIDATED)) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST,
                "Action bloquée par la conformité LCB-FT : Le client fait l'objet d'une alerte confirmée sur liste de sanctions internationales. Le statut ne peut pas être passé à VALIDÉ."
            );
        }

        entity.setClientStatus(status);
        return mapper.toDto(repository.save(entity));
    }
}
