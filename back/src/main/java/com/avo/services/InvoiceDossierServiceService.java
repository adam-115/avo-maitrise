package com.avo.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.avo.dtos.InvoiceDossierServiceDTO;
import com.avo.entities.InvoiceDossierService;
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

    public InvoiceDossierServiceService(InvoiceDossierServiceRepository repository, 
                                        InvoiceDossierServiceMapper mapper,
                                        CurrentUserInfoService currentUserInfoService) {
        this.repository = repository;
        this.mapper = mapper;
        this.currentUserInfoService = currentUserInfoService;
    }

    public Page<InvoiceDossierServiceDTO> findAll(Pageable pageable) {
        log.info("[ENTER] Executing findAll");
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public List<InvoiceDossierServiceDTO> findAll() {
        log.info("[ENTER] Executing findAll");
        return repository.findAll().stream().map(mapper::toDto).collect(Collectors.toList());
    }

    public Page<InvoiceDossierServiceDTO> search(Predicate predicate, Pageable pageable) {
        log.info("[ENTER] Executing search");
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public InvoiceDossierServiceDTO findById(Long id) {
        log.info("[ENTER] Executing findById");
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public InvoiceDossierServiceDTO create(InvoiceDossierServiceDTO dto) {
        log.info("[ENTER] Executing create");
        InvoiceDossierService entity = mapper.toEntity(dto);
        entity.setCreationDate(new Date());
        entity.setCreatedBy(currentUserInfoService.getCurrentUser());
        return mapper.toDto(repository.save(entity));
    }

    public InvoiceDossierServiceDTO update(InvoiceDossierServiceDTO dto) {
        log.info("[ENTER] Executing update");
        InvoiceDossierService entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public void delete(Long id) {

        
        // log.info("[ENTER] Executing delete");
        // InvoiceDossierService entity = this.repository.findById(id).get();
        
        // if(entity.getInvoiceDossierServieStatus().getCode().equals("FACTURE") ) {
        //     throw new RuntimeException("Impossible de supprimer la prestation");
        // }
        // repository.deleteById(id);
    }
}
