package com.avo.services;

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

    @org.springframework.transaction.annotation.Transactional
    public ScreeningMatchDTO processDecision(Long matchId, com.avo.entities.ScreeningMatchStatus decision, String comment, String reviewer) {
        ScreeningMatch match = repository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        match.setStatus(decision);
        match.setReviewerComment(comment);
        match.setReviewedBy(reviewer);
        match.setReviewedAt(java.time.LocalDateTime.now());

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

    private void updateClientAmlStatus(com.avo.entities.ClientEntity client) {
        // Logic: find the last execution for this client and load only matches related to it
        com.avo.entities.ScreeningExecution lastExec = screeningExecutionRepository.findFirstByClientIdOrderByCreatedAtDesc(client.getId())
                .orElse(null);
        
        if (lastExec == null) return;

        java.util.List<ScreeningMatch> matches = repository.findByScreeningExecutionId(lastExec.getId());
        boolean hasBlocked = matches.stream().anyMatch(m -> m.getStatus() == com.avo.entities.ScreeningMatchStatus.TRUE_POSITIVE);
        boolean hasDiligence = matches.stream().anyMatch(m -> m.getStatus() == com.avo.entities.ScreeningMatchStatus.DILIGENCE_REQUIRED);
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
                "Indulgence AML Requise",
                "Le statut du client " + clientName + " est passé à Indulgence/Dérogation requise. Une approbation ou vigilance complémentaire est nécessaire.",
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
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<ScreeningMatchDTO> search(Predicate predicate, Pageable pageable) {
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public ScreeningMatchDTO findById(Long id) {
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public ScreeningMatchDTO create(ScreeningMatchDTO dto) {
        ScreeningMatch entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public ScreeningMatchDTO update(ScreeningMatchDTO dto) {
        ScreeningMatch entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }


    // public Page<ScreeningMatchDTO> getMatchesByClientId(Long clientId, Pageable pageable) {
    //     QScreeningMatch qMatch = QScreeningMatch.screeningMatch;
        
    //     // On définit la condition (Predicate)
    //     Predicate condition = qMatch.client.id.eq(clientId);
        
    //     // On exécute avec la pagination et le tri inclus dans l'objet pageable
    //     return repository.findAll(condition, pageable).map(mapper::toDto);
        
    // }
    
    // public void delete(Long id) {
    //     repository.deleteById(id);
    // }



}
