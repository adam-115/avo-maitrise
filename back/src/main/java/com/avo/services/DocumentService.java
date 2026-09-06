package com.avo.services;

import lombok.extern.slf4j.Slf4j;
import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.avo.dtos.DocumentDTO;
import com.avo.entities.Document;
import com.avo.mappers.DocumentMapper;
import com.avo.repositories.DocumentRepository;
import com.querydsl.core.types.Predicate;
import com.avo.entities.DocumentType;

@Service
@Slf4j
public class DocumentService {

    private final DocumentRepository repository;
    private final DocumentMapper mapper;
    private final com.avo.repositories.ClientRepository clientRepository;
    private final com.avo.repositories.DossierRepository dossierRepository;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    public DocumentService(DocumentRepository repository, DocumentMapper mapper, 
                           com.avo.repositories.ClientRepository clientRepository,
                           com.avo.repositories.DossierRepository dossierRepository,
                           org.springframework.context.ApplicationEventPublisher eventPublisher) {
        this.repository = repository;
        this.mapper = mapper;
        this.clientRepository = clientRepository;
        this.dossierRepository = dossierRepository;
        this.eventPublisher = eventPublisher;
    }

    public Page<DocumentDTO> findAll(Pageable pageable) {
        log.info("[ENTER] Executing findAll");
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<DocumentDTO> search(Predicate predicate, Pageable pageable) {
        log.info("[ENTER] Executing search");
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public DocumentDTO findById(Long id) {
        log.info("[ENTER] Executing findById");
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public DocumentDTO create(DocumentDTO dto) {
        log.info("[ENTER] Executing create");
        Document entity = mapper.toEntity(dto);
        entity.setDateUpload(LocalDateTime.now());
        
        if (dto.getClientId() != null) {
            clientRepository.findById(dto.getClientId()).ifPresent(entity::setClient);
        }
        if (dto.getDossierId() != null) {
            dossierRepository.findById(dto.getDossierId()).ifPresent(entity::setDossier);
        }

        // Dynamically classify document type
        if (entity.getDossier() != null) {
            entity.setTypeDocument(DocumentType.DOSSIER);
        } else if (entity.getClient() != null) {
            entity.setTypeDocument(DocumentType.CLIENT);
        } else {
            entity.setTypeDocument(DocumentType.MODEL);
        }

        Document saved = repository.save(entity);
        
        if (saved.getTypeDocument() == DocumentType.DOSSIER) {
            eventPublisher.publishEvent(new com.avo.events.MatterActionEvent(
                this, saved.getDossier() != null ? saved.getDossier().getId() : dto.getDossierId(), 
                getCurrentUsername(), "Upload", "Document", saved.getId(), "Document uploadé : " + saved.getNomFichier()
            ));
        }
        
        return mapper.toDto(saved);
    }

    public DocumentDTO update(DocumentDTO dto) {
        log.info("[ENTER] Executing update");
        Document entity = mapper.toEntity(dto);

        if (dto.getClientId() != null) {
            clientRepository.findById(dto.getClientId()).ifPresent(entity::setClient);
        }
        if (dto.getDossierId() != null) {
            dossierRepository.findById(dto.getDossierId()).ifPresent(entity::setDossier);
        }

        // Dynamically classify document type
        if (entity.getDossier() != null) {
            entity.setTypeDocument(DocumentType.DOSSIER);
        } else if (entity.getClient() != null) {
            entity.setTypeDocument(DocumentType.CLIENT);
        } else {
            entity.setTypeDocument(DocumentType.MODEL);
        }

        Document saved = repository.save(entity);

        if (saved.getTypeDocument() == DocumentType.DOSSIER) {
            eventPublisher.publishEvent(new com.avo.events.MatterActionEvent(
                this, saved.getDossier() != null ? saved.getDossier().getId() : dto.getDossierId(),
                getCurrentUsername(), "Mise à jour", "Document", saved.getId(), "Document mis à jour : " + saved.getNomFichier()
            ));
        }

        return mapper.toDto(saved);
    }
    
    @org.springframework.transaction.annotation.Transactional
    public void delete(Long id) {
        log.info("[ENTER] Executing delete");
        repository.findById(id).ifPresent(doc -> {
            if (doc.getTypeDocument() == DocumentType.DOSSIER) {
                eventPublisher.publishEvent(new com.avo.events.MatterActionEvent(
                    this, doc.getDossier() != null ? doc.getDossier().getId() : null,
                    getCurrentUsername(), "Suppression", "Document", doc.getId(), "Document supprimé : " + doc.getNomFichier()
                ));
            }
            repository.deleteDossierDocumentAssociation(doc.getId());
            repository.delete(doc);
        });
    }

    private String getCurrentUsername() {
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null) return auth.getName();
        } catch (Exception e) {}
        return "Système";
    }
}
