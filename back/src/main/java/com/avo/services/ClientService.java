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

    public ClientService(ClientRepository repository, ClientEntityMapper mapper, com.avo.repositories.ScreeningMatchRepository screeningMatchRepository) {
        this.repository = repository;
        this.mapper = mapper;
        this.screeningMatchRepository = screeningMatchRepository;
    }

    public Page<ClientEntityDTO> findAll(Pageable pageable) {
        log.info("[ENTER] Executing findAll");
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<ClientEntityDTO> findAllWithFilters(String searchTerm, String type, com.avo.entities.ClientStatus status, String risk, Pageable pageable) {
        log.info("[ENTER] Executing findAllWithFilters");
        return repository.searchWithFilters(searchTerm, type, status, risk, pageable).map(mapper::toDto);
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

    public ClientEntityDTO update(ClientEntityDTO dto) {
        log.info("[ENTER] Executing update");
        ClientEntity existing = repository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Client not found"));
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
    
    public void delete(Long id) {
        log.info("[ENTER] Executing delete");
        repository.deleteById(id);
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
