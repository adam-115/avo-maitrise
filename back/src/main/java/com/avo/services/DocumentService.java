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
    private final MinioService minioService;
    private final com.avo.service.ai.RAGDocumentService ragDocumentService;

    public DocumentService(DocumentRepository repository, DocumentMapper mapper,
            com.avo.repositories.ClientRepository clientRepository,
            com.avo.repositories.DossierRepository dossierRepository,
            org.springframework.context.ApplicationEventPublisher eventPublisher,
            MinioService minioService,
            com.avo.service.ai.RAGDocumentService ragDocumentService) {
        this.repository = repository;
        this.mapper = mapper;
        this.clientRepository = clientRepository;
        this.dossierRepository = dossierRepository;
        this.eventPublisher = eventPublisher;
        this.minioService = minioService;
        this.ragDocumentService = ragDocumentService;
    }

    public Page<DocumentDTO> findAll(Pageable pageable) {
        log.info("[ENTER] Executing findAll");
        return repository.findAll(pageable).map(doc -> {
            DocumentDTO dto = mapper.toDto(doc);
            enrichWithPresignedUrl(dto);
            return dto;
        });
    }

    public Page<DocumentDTO> search(Predicate predicate, Pageable pageable) {
        log.info("[ENTER] Executing search");
        return repository.findAll(predicate, pageable).map(doc -> {
            DocumentDTO dto = mapper.toDto(doc);
            enrichWithPresignedUrl(dto);
            return dto;
        });
    }

    public DocumentDTO findById(Long id) {
        log.info("[ENTER] Executing findById");
        return repository.findById(id).map(doc -> {
            DocumentDTO dto = mapper.toDto(doc);
            enrichWithPresignedUrl(dto);
            return dto;
        }).orElse(null);
    }

    private void enrichWithPresignedUrl(DocumentDTO dto) {
        if (dto != null && dto.getMinioObjectId() != null) {
            dto.setUrlStockage(minioService.getPresignedUrl(dto.getMinioObjectId()));
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public DocumentDTO create(DocumentDTO dto) {
        log.info("[ENTER] Executing create");
        Document entity = mapper.toEntity(dto);
        entity.setDateUpload(LocalDateTime.now());

        if (dto.getFileData() != null && !dto.getFileData().isEmpty()) {
            try {
                String contentType = java.net.URLConnection.guessContentTypeFromName(dto.getNomFichier());
                if (contentType == null) {
                    String lowerName = dto.getNomFichier() != null ? dto.getNomFichier().toLowerCase() : "";
                    if (lowerName.endsWith(".pdf")) contentType = "application/pdf";
                    else if (lowerName.endsWith(".doc")) contentType = "application/msword";
                    else if (lowerName.endsWith(".docx")) contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                    else if (lowerName.endsWith(".xls")) contentType = "application/vnd.ms-excel";
                    else if (lowerName.endsWith(".xlsx")) contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                    else if (lowerName.endsWith(".txt")) contentType = "text/plain";
                    else if (lowerName.endsWith(".png")) contentType = "image/png";
                    else if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) contentType = "image/jpeg";
                    else contentType = "application/octet-stream";
                }

                String base64Data = dto.getFileData();
                // Remove data:image/png;base64, prefix if present
                if (base64Data.contains(",")) {
                    base64Data = base64Data.split(",")[1];
                }

                byte[] decodedBytes = java.util.Base64.getDecoder().decode(base64Data);
                try (java.io.InputStream is = new java.io.ByteArrayInputStream(decodedBytes)) {
                    String minioObjectId = minioService.uploadFile(
                            dto.getNomFichier() != null ? dto.getNomFichier() : "document",
                            is,
                            decodedBytes.length,
                            contentType);
                    entity.setMinioObjectId(minioObjectId);
                }
            } catch (Exception e) {
                log.error("Failed to upload file to MinIO", e);
                throw new RuntimeException("Erreur lors de la sauvegarde du fichier dans MinIO : " + e.getMessage(), e);
            }
        }

        if (dto.getClientId() != null) {
            clientRepository.findById(dto.getClientId()).ifPresent(entity::setClient);
        }
        if (dto.getDossierId() != null) {
            dossierRepository.findById(dto.getDossierId()).ifPresent(entity::setDossier);
        }

        // Dynamically classify document type if not explicitly set to special types
        if (entity.getTypeDocument() == null || (entity.getTypeDocument() != DocumentType.JURISPRUDENCE
                && entity.getTypeDocument() != DocumentType.LEGISLATION)) {
            if (entity.getDossier() != null) {
                entity.setTypeDocument(DocumentType.DOSSIER);
            } else if (entity.getClient() != null) {
                entity.setTypeDocument(DocumentType.CLIENT);
            } else if (entity.getTypeDocument() == null) {
                entity.setTypeDocument(DocumentType.MODEL);
            }
        }

        Document saved = repository.save(entity);

        if (saved.getTypeDocument() == DocumentType.DOSSIER) {
            eventPublisher.publishEvent(new com.avo.events.MatterActionEvent(
                    this, saved.getDossier() != null ? saved.getDossier().getId() : dto.getDossierId(),
                    getCurrentUsername(), "Upload", "Document", saved.getId(),
                    "Document uploadé : " + saved.getNomFichier()));
        }

        try {
            // Lancer l'ingestion vers Qdrant en arrière-plan (Asynchrone) APRÈS le commit de la transaction
            if (org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive()) {
                org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                    new org.springframework.transaction.support.TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            ragDocumentService.ingestDocumentIntoQdrant(saved.getId());
                        }
                    }
                );
            } else {
                ragDocumentService.ingestDocumentIntoQdrant(saved.getId());
            }
        } catch (Exception e) {
            log.error("Erreur lors de l'ingestion automatique vers Qdrant pour le doc: " + saved.getId(), e);
        }

        return mapper.toDto(saved);
    }

    @org.springframework.transaction.annotation.Transactional
    public DocumentDTO update(DocumentDTO dto) {
        log.info("[ENTER] Executing update");
        Document entity = mapper.toEntity(dto);

        if (dto.getFileData() != null && !dto.getFileData().isEmpty()) {
            try {
                String contentType = java.net.URLConnection.guessContentTypeFromName(dto.getNomFichier());
                if (contentType == null) {
                    String lowerName = dto.getNomFichier() != null ? dto.getNomFichier().toLowerCase() : "";
                    if (lowerName.endsWith(".pdf")) contentType = "application/pdf";
                    else if (lowerName.endsWith(".doc")) contentType = "application/msword";
                    else if (lowerName.endsWith(".docx")) contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                    else if (lowerName.endsWith(".xls")) contentType = "application/vnd.ms-excel";
                    else if (lowerName.endsWith(".xlsx")) contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                    else if (lowerName.endsWith(".txt")) contentType = "text/plain";
                    else if (lowerName.endsWith(".png")) contentType = "image/png";
                    else if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) contentType = "image/jpeg";
                    else contentType = "application/octet-stream";
                }

                String base64Data = dto.getFileData();
                if (base64Data.contains(",")) {
                    base64Data = base64Data.split(",")[1];
                }

                byte[] decodedBytes = java.util.Base64.getDecoder().decode(base64Data);
                try (java.io.InputStream is = new java.io.ByteArrayInputStream(decodedBytes)) {
                    String minioObjectId = minioService.uploadFile(
                            dto.getNomFichier() != null ? dto.getNomFichier() : "document",
                            is,
                            decodedBytes.length,
                            contentType);
                    entity.setMinioObjectId(minioObjectId);
                }
            } catch (Exception e) {
                log.error("Failed to upload file to MinIO during update", e);
                throw new RuntimeException("Erreur lors de la mise à jour du fichier dans MinIO : " + e.getMessage(),
                        e);
            }
        } else {
            // Keep existing minioObjectId if fileData wasn't updated
            repository.findById(dto.getId()).ifPresent(existing -> {
                entity.setMinioObjectId(existing.getMinioObjectId());
            });
        }

        if (dto.getClientId() != null) {
            clientRepository.findById(dto.getClientId()).ifPresent(entity::setClient);
        }
        if (dto.getDossierId() != null) {
            dossierRepository.findById(dto.getDossierId()).ifPresent(entity::setDossier);
        }

        // Dynamically classify document type if not explicitly set to special types
        if (entity.getTypeDocument() == null || (entity.getTypeDocument() != DocumentType.JURISPRUDENCE
                && entity.getTypeDocument() != DocumentType.LEGISLATION)) {
            if (entity.getDossier() != null) {
                entity.setTypeDocument(DocumentType.DOSSIER);
            } else if (entity.getClient() != null) {
                entity.setTypeDocument(DocumentType.CLIENT);
            } else if (entity.getTypeDocument() == null) {
                entity.setTypeDocument(DocumentType.MODEL);
            }
        }

        Document saved = repository.save(entity);

        if (saved.getTypeDocument() == DocumentType.DOSSIER) {
            eventPublisher.publishEvent(new com.avo.events.MatterActionEvent(
                    this, saved.getDossier() != null ? saved.getDossier().getId() : dto.getDossierId(),
                    getCurrentUsername(), "Mise à jour", "Document", saved.getId(),
                    "Document mis à jour : " + saved.getNomFichier()));
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
                        getCurrentUsername(), "Suppression", "Document", doc.getId(),
                        "Document supprimé : " + doc.getNomFichier()));
            }
            if (doc.getMinioObjectId() != null) {
                minioService.deleteFile(doc.getMinioObjectId());
            }
            repository.deleteDossierDocumentAssociation(doc.getId());
            repository.delete(doc);
        });
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
}
