package com.avo.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import com.avo.config.SecurityUtils;
import com.avo.dtos.InvoiceDossierServiceDTO;
import com.avo.entities.InvoiceDossierService;
import com.avo.entities.InvoiceDossierServiceStatusEnum;
import com.avo.mappers.InvoiceDossierServiceMapper;
import com.avo.repositories.InvoiceDossierServiceRepository;
import com.querydsl.core.types.Predicate;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class InvoiceDossierServiceService {

    private final InvoiceDossierServiceRepository repository;
    private final InvoiceDossierServiceMapper mapper;
    private final CurrentUserInfoService currentUserInfoService;
    private final SecurityUtils securityUtils;

    public InvoiceDossierServiceService(InvoiceDossierServiceRepository repository, 
                                        InvoiceDossierServiceMapper mapper,
                                        CurrentUserInfoService currentUserInfoService,
                                        SecurityUtils securityUtils) {
        this.repository = repository;
        this.mapper = mapper;
        this.currentUserInfoService = currentUserInfoService;
        this.securityUtils = securityUtils;
    }

    public Page<InvoiceDossierServiceDTO> findAll(Pageable pageable) {
        log.info("[ENTER] Executing findAll");
        if (!securityUtils.canViewAllDossiers()) {
            List<String> userIds = securityUtils.getCurrentUserIdentifiers();
            return repository.findAllScoped(true, userIds, pageable).map(mapper::toDto);
        }
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public List<InvoiceDossierServiceDTO> findAll() {
        log.info("[ENTER] Executing findAll");
        if (!securityUtils.canViewAllDossiers()) {
            List<String> userIds = securityUtils.getCurrentUserIdentifiers();
            return repository.findAllScoped(true, userIds).stream().map(mapper::toDto).collect(Collectors.toList());
        }
        return repository.findAll().stream().map(mapper::toDto).collect(Collectors.toList());
    }

    public Page<InvoiceDossierServiceDTO> search(Predicate predicate, Pageable pageable) {
        log.info("[ENTER] Executing search");
        com.querydsl.core.BooleanBuilder builder = new com.querydsl.core.BooleanBuilder();
        if (predicate != null) {
            builder.and(predicate);
        }
        com.querydsl.core.types.dsl.BooleanExpression scope = securityUtils.getInvoiceDossierServiceScopeExpression();
        if (scope != null) {
            builder.and(scope);
        }
        return repository.findAll(builder, pageable).map(mapper::toDto);
    }

    public InvoiceDossierServiceDTO findById(Long id) {
        log.info("[ENTER] Executing findById");
        InvoiceDossierService entity = repository.findById(id).orElse(null);
        if (entity != null && entity.getDossier() != null && !securityUtils.isDossierAllowedForUser(entity.getDossier())) {
            throw new AccessDeniedException("Accès refusé : vous n'avez pas les droits pour consulter cette prestation.");
        }
        return entity != null ? mapper.toDto(entity) : null;
    }

    public InvoiceDossierServiceDTO create(InvoiceDossierServiceDTO dto) {
        log.info("[ENTER] Executing create");
        if (dto.getDossier() != null && dto.getDossier().getId() != null) {
            if (!securityUtils.canAccessDossier(dto.getDossier().getId())) {
                throw new AccessDeniedException("Accès refusé : vous ne pouvez créer une prestation que sur un dossier qui vous est assigné ou créé par vous.");
            }
        }
        InvoiceDossierService entity = mapper.toEntity(dto);
        entity.setCreationDate(new Date());
        entity.setCreatedBy(currentUserInfoService.getCurrentUser());

        
        // Prevent manual creation directly with system-managed statuses
        if (entity.getStatus() == null 
                || InvoiceDossierServiceStatusEnum.FACTUREE.equals(entity.getStatus())
                || InvoiceDossierServiceStatusEnum.EN_COURS_DE_FACTURATION.equals(entity.getStatus())) {
            entity.setStatus(InvoiceDossierServiceStatusEnum.A_FACTURE);
        }
        
        return mapper.toDto(repository.save(entity));
    }

    public InvoiceDossierServiceDTO update(InvoiceDossierServiceDTO dto) {
        log.info("[ENTER] Executing update");
        InvoiceDossierService existing = repository.findById(dto.getId()).orElseThrow(() -> new RuntimeException("Prestation non trouvée"));
        
        if (existing.getStatus() != null) {
            InvoiceDossierServiceStatusEnum status = existing.getStatus();
            if (InvoiceDossierServiceStatusEnum.FACTUREE.equals(status) || InvoiceDossierServiceStatusEnum.EN_COURS_DE_FACTURATION.equals(status)) {
                throw new RuntimeException("Impossible de modifier une prestation facturée ou en cours de facturation");
            }
        }
        
        InvoiceDossierService entity = mapper.toEntity(dto);
        
        // Prevent manual escalation to system-managed statuses from standalone update
        if (InvoiceDossierServiceStatusEnum.FACTUREE.equals(entity.getStatus())
                || InvoiceDossierServiceStatusEnum.EN_COURS_DE_FACTURATION.equals(entity.getStatus())) {
            entity.setStatus(existing.getStatus());
        }
        
        entity.setCreationDate(existing.getCreationDate());
        entity.setCreatedBy(existing.getCreatedBy());
        
        return mapper.toDto(repository.save(entity));
    }

    public InvoiceDossierService saveEntity(InvoiceDossierService entity) {
        return repository.save(entity);
    }

    public void delete(Long id) {
        log.info("[ENTER] Executing delete");
        InvoiceDossierService entity = repository.findById(id).orElseThrow(() -> new RuntimeException("Prestation non trouvée"));
        
        if (entity.getStatus() != null) {
            InvoiceDossierServiceStatusEnum status = entity.getStatus();
            if (InvoiceDossierServiceStatusEnum.FACTUREE.equals(status) || InvoiceDossierServiceStatusEnum.EN_COURS_DE_FACTURATION.equals(status)) {
                throw new RuntimeException("Impossible de supprimer une prestation facturée ou en cours de facturation");
            }
        }
        
        repository.deleteById(id);
    }
}
