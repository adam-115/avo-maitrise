package com.avo.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.avo.dtos.ScreeningMatchDTO;
import com.avo.entities.QScreeningMatch;
import com.avo.entities.ScreeningMatch;
import com.avo.mappers.ScreeningMatchMapper;
import com.avo.repositories.ScreeningMatchRepository;
import com.querydsl.core.types.Predicate;

@Service
@Slf4j
public class ScreeningMatchService {

    private final ScreeningMatchRepository repository;
    private final ScreeningMatchMapper mapper;
    private final com.avo.repositories.ClientRepository clientRepository;
    private final com.avo.repositories.UBORepository uboRepository;
    private final com.avo.repositories.NotificationRepository notificationRepository;
    private final com.avo.yente.client.YenteApiClient yenteApiClient;
    private final com.avo.repositories.ScreeningExecutionRepository screeningExecutionRepository;

    public ScreeningMatchService(ScreeningMatchRepository repository, ScreeningMatchMapper mapper,
                                com.avo.repositories.ClientRepository clientRepository,
                                com.avo.repositories.UBORepository uboRepository,
                                com.avo.repositories.NotificationRepository notificationRepository,
                                com.avo.yente.client.YenteApiClient yenteApiClient,
                                com.avo.repositories.ScreeningExecutionRepository screeningExecutionRepository) {
        this.repository = repository;
        this.mapper = mapper;
        this.clientRepository = clientRepository;
        this.uboRepository = uboRepository;
        this.notificationRepository = notificationRepository;
        this.yenteApiClient = yenteApiClient;
        this.screeningExecutionRepository = screeningExecutionRepository;
    }

    @jakarta.annotation.PostConstruct
    @org.springframework.transaction.annotation.Transactional
    public void initCleanOrphans() {
        log.info("[ENTER] Executing initCleanOrphans");
        try {
            repository.deleteOrphanedMatches();
        } catch (Exception e) {
            System.err.println("Failed to delete orphaned screening matches: " + e.getMessage());
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public ScreeningMatchDTO processDecision(Long matchId, com.avo.entities.ScreeningMatchStatus decision, String comment, String reviewer) {
        log.info("[ENTER] Executing processDecision");
        ScreeningMatch match = repository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        match.setStatus(decision);
        match.setReviewerComment(comment);
        match.setReviewedBy(reviewer);
        match.setReviewedAt(java.time.LocalDateTime.now());

        if (match.getClient() != null) {
            Long currentVersion = match.getClient().getVersion() != null ? match.getClient().getVersion() : 1L;
            match.setClientVersionAtReview(currentVersion);
        } else if (match.getUbo() != null && match.getUbo().getClientMoral() != null) {
            Long currentVersion = match.getUbo().getClientMoral().getVersion() != null ? match.getUbo().getClientMoral().getVersion() : 1L;
            match.setClientVersionAtReview(currentVersion);
        }

        if (decision == com.avo.entities.ScreeningMatchStatus.FALSE_POSITIVE) {
            // Fetch current state from Yente to snapshot the version
            try {
                com.avo.yente.models.YenteMatchResult entity = yenteApiClient.getEntity(match.getYenteId());
                if (entity != null) {
                    match.setYenteLastUpdate(entity.lastChange());
                }
            } catch (Exception e) {
                System.err.println("Failed to fetch entity for decision snapshot: " + e.getMessage());
            }
        }

        repository.save(match);

        // Update Client Status if necessary
        if (match.getClient() != null) {
            updateClientAmlStatus(match.getClient());
        } else if (match.getUbo() != null) {
            // For UBOs, we might want to check the associated client? 
            // In this app, it seems UBOs are linked to clients.
        }

        return mapper.toDto(match);
    }

    @org.springframework.transaction.annotation.Transactional
    public java.util.List<ScreeningMatchDTO> processBatchDecision(java.util.List<Long> matchIds, com.avo.entities.ScreeningMatchStatus decision, String comment, String reviewer) {
        log.info("[ENTER] Executing processBatchDecision for {} matches", matchIds != null ? matchIds.size() : 0);
        java.util.List<ScreeningMatchDTO> results = new java.util.ArrayList<>();
        if (matchIds != null) {
            for (Long id : matchIds) {
                results.add(processDecision(id, decision, comment, reviewer));
            }
        }
        return results;
    }

    private void updateClientAmlStatus(com.avo.entities.ClientEntity client) {
        // Logic: determine client status based on latest active match for each target
        java.util.List<ScreeningMatch> allMatches = repository.findByClientId(client.getId());
        java.util.Map<String, ScreeningMatch> latestByTarget = new java.util.HashMap<>();
        for (ScreeningMatch m : allMatches) {
            String key = m.getYenteId() != null ? m.getYenteId() : String.valueOf(m.getId());
            ScreeningMatch existing = latestByTarget.get(key);
            if (existing == null || (m.getCreatedAt() != null && existing.getCreatedAt() != null && m.getCreatedAt().isAfter(existing.getCreatedAt())) || (m.getId() != null && existing.getId() != null && m.getId() > existing.getId())) {
                latestByTarget.put(key, m);
            }
        }
        
        java.util.Collection<ScreeningMatch> matches = latestByTarget.values();
        boolean hasBlocked = matches.stream().anyMatch(m -> 
            m.getStatus() == com.avo.entities.ScreeningMatchStatus.TRUE_POSITIVE || 
            m.getStatus() == com.avo.entities.ScreeningMatchStatus.TRUE_POSITIVE_SANCTION
        );
        boolean hasDiligence = matches.stream().anyMatch(m -> 
            m.getStatus() == com.avo.entities.ScreeningMatchStatus.DILIGENCE_REQUIRED ||
            m.getStatus() == com.avo.entities.ScreeningMatchStatus.TRUE_POSITIVE_PEP
        );
        boolean hasPending = matches.stream().anyMatch(m -> m.getStatus() == com.avo.entities.ScreeningMatchStatus.PENDING);
        boolean hasNoLongerSanctioned = matches.stream().anyMatch(m -> m.getStatus() == com.avo.entities.ScreeningMatchStatus.NO_LONGER_SANCTIONED);

        if (hasBlocked) {
            client.setClientStatus(com.avo.entities.ClientStatus.BLOCKED);
        } else if (hasDiligence) {
            client.setClientStatus(com.avo.entities.ClientStatus.INDULGENCE_REQUIRED);
            
            String clientName = client.getId().toString();
            if (client instanceof com.avo.entities.ClientPersonnePhysique) {
                com.avo.entities.ClientPersonnePhysique p = (com.avo.entities.ClientPersonnePhysique) client;
                clientName = p.getPrenom() + " " + p.getNom();
            } else if (client instanceof com.avo.entities.ClientMoral) {
                com.avo.entities.ClientMoral m = (com.avo.entities.ClientMoral) client;
                clientName = m.getNomCommercial();
            } else if (client instanceof com.avo.entities.Association) {
                com.avo.entities.Association a = (com.avo.entities.Association) client;
                clientName = a.getNom();
            } else if (client instanceof com.avo.entities.Institution) {
                com.avo.entities.Institution i = (com.avo.entities.Institution) client;
                clientName = i.getNom();
            }

            notificationRepository.save(new com.avo.entities.Notification(
                "Indulgence AML / Vigilance Requise",
                "Le statut du client " + clientName + " nécessite une vigilance renforcée (PPE / Dérogation). Une approbation ou diligence complémentaire est requise.",
                client.getId()
            ));
        } else if (hasPending) {
            client.setClientStatus(com.avo.entities.ClientStatus.VERIFICATION_AML_REQUIRED);
        } else if (hasNoLongerSanctioned) {
            client.setClientStatus(com.avo.entities.ClientStatus.VALIDATED);
        } else {
            client.setClientStatus(com.avo.entities.ClientStatus.AML_VALIDATED);
        }
        clientRepository.save(client);
    }

    public Page<ScreeningMatchDTO> findAll(Pageable pageable) {
        log.info("[ENTER] Executing findAll");
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<ScreeningMatchDTO> search(Predicate predicate, Pageable pageable) {
        log.info("[ENTER] Executing search");
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public ScreeningMatchDTO findById(Long id) {
        log.info("[ENTER] Executing findById");
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public ScreeningMatchDTO create(ScreeningMatchDTO dto) {
        log.info("[ENTER] Executing create");
        ScreeningMatch entity = mapper.toEntity(dto);
        
        // Fetch managed client and UBO from DB to avoid transient reference exceptions
        if (dto.getClientEntityDTO() != null && dto.getClientEntityDTO().getId() != null) {
            entity.setClient(clientRepository.findById(dto.getClientEntityDTO().getId()).orElse(null));
        } else if (dto.getUboDTO() != null && dto.getUboDTO().getClientMoralId() != null) {
            entity.setClient(clientRepository.findById(dto.getUboDTO().getClientMoralId()).orElse(null));
        }
        
        if (dto.getUboDTO() != null && dto.getUboDTO().getId() != null) {
            entity.setUbo(uboRepository.findById(dto.getUboDTO().getId()).orElse(null));
        }
        
        if (dto.getScreeningExecutionDTO() != null && dto.getScreeningExecutionDTO().getId() != null) {
            entity.setScreeningExecution(screeningExecutionRepository.findById(dto.getScreeningExecutionDTO().getId()).orElse(null));
        }
        
        return mapper.toDto(repository.save(entity));
    }

    public ScreeningMatchDTO update(ScreeningMatchDTO dto) {
        log.info("[ENTER] Executing update");
        ScreeningMatch entity = mapper.toEntity(dto);
        
        if (dto.getClientEntityDTO() != null && dto.getClientEntityDTO().getId() != null) {
            entity.setClient(clientRepository.findById(dto.getClientEntityDTO().getId()).orElse(null));
        } else if (dto.getUboDTO() != null && dto.getUboDTO().getClientMoralId() != null) {
            entity.setClient(clientRepository.findById(dto.getUboDTO().getClientMoralId()).orElse(null));
        }
        
        if (dto.getUboDTO() != null && dto.getUboDTO().getId() != null) {
            entity.setUbo(uboRepository.findById(dto.getUboDTO().getId()).orElse(null));
        }
        
        if (dto.getScreeningExecutionDTO() != null && dto.getScreeningExecutionDTO().getId() != null) {
            entity.setScreeningExecution(screeningExecutionRepository.findById(dto.getScreeningExecutionDTO().getId()).orElse(null));
        }
        return mapper.toDto(repository.save(entity));
    }

    public Page<ScreeningMatchDTO> findByClientId(Long clientId, Pageable pageable) {
        log.info("[ENTER] Executing findByClientId for client: {}", clientId);
        return repository.findPageByClientId(clientId, pageable).map(mapper::toDto);
    }

    public Page<ScreeningMatchDTO> findByUboId(Long uboId, Pageable pageable) {
        log.info("[ENTER] Executing findByUboId for ubo: {}", uboId);
        return repository.findPageByUboId(uboId, pageable).map(mapper::toDto);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
