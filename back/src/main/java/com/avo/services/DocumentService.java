package com.avo.services;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.net.URLConnection;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.avo.dtos.DocumentDTO;
import com.avo.entities.Document;
import com.avo.entities.DocumentType;
import com.avo.events.MatterActionEvent;
import com.avo.mappers.DocumentMapper;
import com.avo.repositories.ClientRepository;
import com.avo.repositories.DocumentRepository;
import com.avo.repositories.DossierRepository;
import com.avo.service.ai.RAGDocumentService;
import com.querydsl.core.types.Predicate;

import io.minio.StatObjectResponse;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class DocumentService {

    private final DocumentRepository repository;
    private final DocumentMapper mapper;
    private final ClientRepository clientRepository;
    private final DossierRepository dossierRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final MinioService minioService;
    private final RAGDocumentService ragDocumentService;

    public DocumentService(DocumentRepository repository, DocumentMapper mapper,
            ClientRepository clientRepository,
            DossierRepository dossierRepository,
            ApplicationEventPublisher eventPublisher,
            MinioService minioService,
            RAGDocumentService ragDocumentService) {
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
        if (dto != null && dto.getId() != null) {
            dto.setUrlStockage("/api/documents/" + dto.getId() + "/download");
        }
    }

    @Transactional
    public DocumentDTO create(DocumentDTO dto) {
        log.info("[ENTER] Executing create");
        Document documentEntity = mapper.toEntity(dto);
        documentEntity.setDateUpload(LocalDateTime.now());

        if (dto.getFileData() != null && !dto.getFileData().isEmpty()) {
            try {
                String contentType = URLConnection.guessContentTypeFromName(dto.getNomFichier());
                if (contentType == null) {
                    String lowerName = dto.getNomFichier() != null ? dto.getNomFichier().toLowerCase() : "";
                    if (lowerName.endsWith(".pdf"))
                        contentType = "application/pdf";
                    else if (lowerName.endsWith(".doc"))
                        contentType = "application/msword";
                    else if (lowerName.endsWith(".docx"))
                        contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                    else if (lowerName.endsWith(".xls"))
                        contentType = "application/vnd.ms-excel";
                    else if (lowerName.endsWith(".xlsx"))
                        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                    else if (lowerName.endsWith(".txt"))
                        contentType = "text/plain";
                    else if (lowerName.endsWith(".png"))
                        contentType = "image/png";
                    else if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg"))
                        contentType = "image/jpeg";
                    else
                        contentType = "application/octet-stream";
                }

                String base64Data = dto.getFileData();
                // Remove data:image/png;base64, prefix if present
                if (base64Data.contains(",")) {
                    base64Data = base64Data.split(",")[1];
                }

                // create file in and get minioObjectIdminIO
                byte[] decodedBytes = Base64.getDecoder().decode(base64Data);
                try (InputStream is = new ByteArrayInputStream(decodedBytes)) {
                    String minioObjectId = minioService.uploadFile(
                            dto.getNomFichier() != null ? dto.getNomFichier() : "document",
                            is,
                            decodedBytes.length,
                            contentType);
                    documentEntity.setMinioObjectId(minioObjectId);
                }
            } catch (Exception e) {
                log.error("Failed to upload file to MinIO", e);
                throw new RuntimeException("Erreur lors de la sauvegarde du fichier dans MinIO : " + e.getMessage(), e);
            }
        }

        if (dto.getClientId() != null) {
            clientRepository.findById(dto.getClientId()).ifPresent(documentEntity::setClient);
        }
        if (dto.getDossierId() != null) {
            dossierRepository.findById(dto.getDossierId()).ifPresent(documentEntity::setDossier);
        }

        // Dynamically classify document type if not explicitly set to special types
        if (documentEntity.getTypeDocument() == null || (documentEntity.getTypeDocument() != DocumentType.JURISPRUDENCE
                && documentEntity.getTypeDocument() != DocumentType.LEGISLATION)) {
            if (documentEntity.getDossier() != null) {
                documentEntity.setTypeDocument(DocumentType.DOSSIER);
            } else if (documentEntity.getClient() != null) {
                documentEntity.setTypeDocument(DocumentType.CLIENT);
            } else if (documentEntity.getTypeDocument() == null) {
                documentEntity.setTypeDocument(DocumentType.MODEL);
            }
        }
        // save document into MySql with minioObjectId
        Document saved = repository.save(documentEntity);

        // add logs via the the Events
        if (saved.getTypeDocument() == DocumentType.DOSSIER) {
            eventPublisher.publishEvent(new MatterActionEvent(
                    this, saved.getDossier() != null ? saved.getDossier().getId() : dto.getDossierId(),
                    getCurrentUsername(), "Upload", "Document", saved.getId(),
                    "Document uploadé : " + saved.getNomFichier()));
        }

        try {
            // Lancer l'ingestion vers Qdrant en arrière-plan (Asynchrone) APRÈS le commit
            // de la transaction
            if (TransactionSynchronizationManager.isSynchronizationActive()) {
                TransactionSynchronizationManager.registerSynchronization(
                        new TransactionSynchronization() {
                            @Override
                            public void afterCommit() {
                                ragDocumentService.ingestDocumentIntoQdrant(saved.getId());
                            }
                        });
            } else {
                ragDocumentService.ingestDocumentIntoQdrant(saved.getId());
            }
        } catch (Exception e) {
            log.error("Erreur lors de l'ingestion automatique vers Qdrant pour le doc: " + saved.getId(), e);
        }

        DocumentDTO result = mapper.toDto(saved);
        enrichWithPresignedUrl(result);
        return result;
    }

    @Transactional
    public DocumentDTO update(DocumentDTO dto) {
        log.info("[ENTER] Executing update");
        Document entity = mapper.toEntity(dto);

        if (dto.getFileData() != null && !dto.getFileData().isEmpty()) {
            try {
                String contentType = URLConnection.guessContentTypeFromName(dto.getNomFichier());
                if (contentType == null) {
                    String lowerName = dto.getNomFichier() != null ? dto.getNomFichier().toLowerCase() : "";
                    if (lowerName.endsWith(".pdf"))
                        contentType = "application/pdf";
                    else if (lowerName.endsWith(".doc"))
                        contentType = "application/msword";
                    else if (lowerName.endsWith(".docx"))
                        contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                    else if (lowerName.endsWith(".xls"))
                        contentType = "application/vnd.ms-excel";
                    else if (lowerName.endsWith(".xlsx"))
                        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                    else if (lowerName.endsWith(".txt"))
                        contentType = "text/plain";
                    else if (lowerName.endsWith(".png"))
                        contentType = "image/png";
                    else if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg"))
                        contentType = "image/jpeg";
                    else
                        contentType = "application/octet-stream";
                }

                String base64Data = dto.getFileData();
                if (base64Data.contains(",")) {
                    base64Data = base64Data.split(",")[1];
                }

                byte[] decodedBytes = Base64.getDecoder().decode(base64Data);
                try (InputStream is = new ByteArrayInputStream(decodedBytes)) {
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
            eventPublisher.publishEvent(new MatterActionEvent(
                    this, saved.getDossier() != null ? saved.getDossier().getId() : dto.getDossierId(),
                    getCurrentUsername(), "Mise à jour", "Document", saved.getId(),
                    "Document mis à jour : " + saved.getNomFichier()));
        }

        DocumentDTO result = mapper.toDto(saved);
        enrichWithPresignedUrl(result);
        return result;
    }

    @Transactional
    public void delete(Long id) {
        log.info("[ENTER] Executing delete");
        repository.findById(id).ifPresent(doc -> {
            if (doc.getTypeDocument() == DocumentType.DOSSIER) {
                eventPublisher.publishEvent(new MatterActionEvent(
                        this, doc.getDossier() != null ? doc.getDossier().getId() : null,
                        getCurrentUsername(), "Suppression", "Document", doc.getId(),
                        "Document supprimé : " + doc.getNomFichier()));
            }
            if (doc.getMinioObjectId() != null) {
                minioService.deleteFile(doc.getMinioObjectId());
            }
            repository.deleteDossierDocumentAssociation(doc.getId());
            repository.delete(doc);
            // Retirer aussi le document de la base vectorielle : l'IA ne doit plus le citer
            ragDocumentService.removeDocumentFromQdrant(doc.getId());
        });
    }

    private String getCurrentUsername() {
        try {
            Authentication auth = SecurityContextHolder
                    .getContext().getAuthentication();
            if (auth != null)
                return auth.getName();
        } catch (Exception e) {
        }
        return "Système";
    }

    public ResponseEntity<Resource> downloadFile(Long id) {
        log.info("[ENTER] Executing downloadFile for document id: {}", id);
        Document doc = repository.findById(id).orElse(null);
        if (doc == null) {
            return ResponseEntity.notFound().build();
        }

        String filename = doc.getNomFichier();
        if (filename == null || filename.isBlank()) {
            filename = doc.getName();
        }
        if (filename == null || filename.isBlank()) {
            filename = "document_" + id;
        }

        String contentType = URLConnection.guessContentTypeFromName(filename);
        if (contentType == null) {
            String lower = filename.toLowerCase();
            if (lower.endsWith(".pdf"))
                contentType = "application/pdf";
            else if (lower.endsWith(".doc"))
                contentType = "application/msword";
            else if (lower.endsWith(".docx"))
                contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            else if (lower.endsWith(".xls"))
                contentType = "application/vnd.ms-excel";
            else if (lower.endsWith(".xlsx"))
                contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            else if (lower.endsWith(".png"))
                contentType = "image/png";
            else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg"))
                contentType = "image/jpeg";
            else
                contentType = "application/octet-stream";
        }

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(contentType);
        } catch (Exception e) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        String encodedFilename;
        try {
            encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8.toString())
                    .replace("+", "%20");
        } catch (Exception e) {
            encodedFilename = filename;
        }

        String contentDisposition = "attachment; filename=\"" + filename.replace("\"", "\\\"") + "\"; filename*=UTF-8''"
                + encodedFilename;

        // 1. Try streaming from MinIO first if minioObjectId is set
        if (doc.getMinioObjectId() != null && !doc.getMinioObjectId().isBlank()) {
            InputStream is = minioService.getFileStream(doc.getMinioObjectId());
            if (is != null) {
                InputStreamResource resource = new InputStreamResource(is);
                var responseBuilder = ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
                        .contentType(mediaType);

                StatObjectResponse stat = minioService.getFileStat(doc.getMinioObjectId());
                if (stat != null && stat.size() > 0) {
                    responseBuilder.contentLength(stat.size());
                }
                return responseBuilder.body(resource);
            }
        }

        return ResponseEntity.notFound().build();
    }
}
