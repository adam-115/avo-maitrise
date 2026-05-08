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
    private final com.avo.repositories.AmlAllowListRepository allowListRepository;
    private final com.avo.repositories.ClientRepository clientRepository;
    private final com.avo.repositories.UBORepository uboRepository;

    public ScreeningMatchService(ScreeningMatchRepository repository, ScreeningMatchMapper mapper,
                                com.avo.repositories.AmlAllowListRepository allowListRepository,
                                com.avo.repositories.ClientRepository clientRepository,
                                com.avo.repositories.UBORepository uboRepository) {
        this.repository = repository;
        this.mapper = mapper;
        this.allowListRepository = allowListRepository;
        this.clientRepository = clientRepository;
        this.uboRepository = uboRepository;
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
            // Add to allow-list
            com.avo.entities.AmlAllowList allowEntry = new com.avo.entities.AmlAllowList(
                match.getClient() != null ? match.getClient().getId() : null,
                match.getUbo() != null ? match.getUbo().getId() : null,
                match.getYenteId(),
                comment
            );
            allowListRepository.save(allowEntry);
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
        // Logic: if any PENDING match exists -> keep status
        // if TRUE_POSITIVE exists -> BLOCKED
        // if all processed and no TRUE_POSITIVE -> AML_VALIDATED (or previous status)
        
        java.util.List<ScreeningMatch> matches = repository.findByClientId(client.getId());
        boolean hasBlocked = matches.stream().anyMatch(m -> m.getStatus() == com.avo.entities.ScreeningMatchStatus.TRUE_POSITIVE);
        boolean hasPending = matches.stream().anyMatch(m -> m.getStatus() == com.avo.entities.ScreeningMatchStatus.PENDING);
        boolean hasEscalated = matches.stream().anyMatch(m -> m.getStatus() == com.avo.entities.ScreeningMatchStatus.ESCALATED);

        if (hasBlocked) {
            client.setClientStatus(com.avo.entities.ClientStatus.BLOCKED);
        } else if (hasPending || hasEscalated) {
            // Keep current suspicious/required status
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
