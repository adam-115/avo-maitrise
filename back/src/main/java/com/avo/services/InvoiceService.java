package com.avo.services;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.avo.dtos.InvoiceDTO;
import com.avo.entities.Invoice;
import com.avo.entities.InvoiceDossierServieStatus;
import com.avo.entities.InvoiceStatusEnum;
import com.avo.entities.InvoiceTimeEntry;
import com.avo.mappers.InvoiceMapper;
import com.avo.repositories.InvoiceRepository;
import com.querydsl.core.types.Predicate;

@Service
@Transactional
public class InvoiceService {

    private final InvoiceRepository repository;
    private final InvoiceMapper mapper;
    private final InvoiceTimeEntryService timeEntryService;
    private final InvoiceDossierServieStatusService statusService;
    private final InvoiceDossierServiceService dossierServiceService;

    public InvoiceService(InvoiceRepository repository, InvoiceMapper mapper, 
                          InvoiceTimeEntryService timeEntryService, 
                          InvoiceDossierServieStatusService statusService,
                          InvoiceDossierServiceService dossierServiceService) {
        this.repository = repository;
        this.mapper = mapper;
        this.timeEntryService = timeEntryService;
        this.statusService = statusService;
        this.dossierServiceService = dossierServiceService;
    }

    public Page<InvoiceDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public Page<InvoiceDTO> search(Predicate predicate, Pageable pageable) {
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public InvoiceDTO findById(Long id) {
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public InvoiceDTO create(InvoiceDTO dto) {
        Invoice entity = mapper.toEntity(dto);
        
        // Default status
        entity.setStatus(InvoiceStatusEnum.DRAFT);
        
        // Generate numeroFacture
        String dossierId = (entity.getDossier() != null && entity.getDossier().getId() != null) ? entity.getDossier().getId().toString() : "0";
        String clientId = (entity.getDossier() != null && entity.getDossier().getClient() != null && entity.getDossier().getClient().getId() != null) ? entity.getDossier().getClient().getId().toString() : "0";
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        entity.setNumeroFacture("INV-" + dossierId + "-" + clientId + "-" + timestamp);
        
        Invoice savedInvoice = repository.save(entity);
        
        if (entity.getInvoiceTimeEntries() != null) {
            InvoiceDossierServieStatus inProgressStatus = statusService.findEntityByCode("EN_COURS_DE_FACTURATION");
            
            for (InvoiceTimeEntry entry : entity.getInvoiceTimeEntries()) {
                entry.setInvoice(savedInvoice);
                
                if (entry.getInvoiceDossierService() != null && inProgressStatus != null) {
                    entry.getInvoiceDossierService().setInvoiceDossierServieStatus(inProgressStatus);
                    dossierServiceService.saveEntity(entry.getInvoiceDossierService());
                }
                
                timeEntryService.saveEntity(entry);
            }
        }
        
        return mapper.toDto(savedInvoice);
    }

    public InvoiceDTO update(InvoiceDTO dto) {
        Invoice entity = mapper.toEntity(dto);
        
        Invoice existingInvoice = repository.findById(entity.getId()).orElse(null);
        boolean isDraft = existingInvoice == null || InvoiceStatusEnum.DRAFT.equals(existingInvoice.getStatus());

        if (!isDraft) {
            // Block modification of time entries and billing fields if invoice is not DRAFT
            if (existingInvoice != null) {
                entity.setInvoiceTimeEntries(existingInvoice.getInvoiceTimeEntries());
                entity.setTaxAmount(existingInvoice.getTaxAmount());
                entity.setSubtotalAmount(existingInvoice.getSubtotalAmount());
                entity.setTotalAmount(existingInvoice.getTotalAmount());
                entity.setDueDate(existingInvoice.getDueDate());
                entity.setNote(existingInvoice.getNote());
                entity.setIssueDate(existingInvoice.getIssueDate());
            }
        }

        if (isDraft && existingInvoice != null && existingInvoice.getInvoiceTimeEntries() != null) {
            java.util.List<Long> incomingIds = new java.util.ArrayList<>();
            if (entity.getInvoiceTimeEntries() != null) {
                incomingIds = entity.getInvoiceTimeEntries().stream()
                        .filter(e -> e.getId() != null)
                        .map(InvoiceTimeEntry::getId)
                        .collect(java.util.stream.Collectors.toList());
            }
            
            InvoiceDossierServieStatus enAttenteStatus = statusService.findEntityByCode("EN_ATTENTE");
            
            for (InvoiceTimeEntry existingEntry : existingInvoice.getInvoiceTimeEntries()) {
                if (!incomingIds.contains(existingEntry.getId())) {
                    if (existingEntry.getInvoiceDossierService() != null && enAttenteStatus != null) {
                        existingEntry.getInvoiceDossierService().setInvoiceDossierServieStatus(enAttenteStatus);
                        dossierServiceService.saveEntity(existingEntry.getInvoiceDossierService());
                    }
                    timeEntryService.delete(existingEntry.getId());
                }
            }
        }

        Invoice savedInvoice = repository.save(entity);
        
        if (isDraft) {
            InvoiceDossierServieStatus inProgressStatus = statusService.findEntityByCode("EN_COURS_DE_FACTURATION");
            
            if (entity.getInvoiceTimeEntries() != null) {
                for (InvoiceTimeEntry entry : entity.getInvoiceTimeEntries()) {
                    entry.setInvoice(savedInvoice);
                    
                    if (entry.getInvoiceDossierService() != null && inProgressStatus != null) {
                        entry.getInvoiceDossierService().setInvoiceDossierServieStatus(inProgressStatus);
                        dossierServiceService.saveEntity(entry.getInvoiceDossierService());
                    }
                    
                    timeEntryService.saveEntity(entry);
                }
            }
        }
        
        return mapper.toDto(savedInvoice);
    }

    public void delete(Long id) {
        // repository.deleteById(id);
    }
}
