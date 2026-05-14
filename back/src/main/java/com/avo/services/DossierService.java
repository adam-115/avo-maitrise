package com.avo.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.avo.dtos.DossierDTO;
import com.avo.entities.Dossier;
import com.avo.mappers.DossierMapper;
import com.avo.repositories.DossierRepository;
import com.querydsl.core.types.Predicate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DossierService {

    private final DossierRepository repository;
    private final com.avo.repositories.ClientRepository clientRepository;
    private final DossierMapper mapper;

    public DossierService(DossierRepository repository, com.avo.repositories.ClientRepository clientRepository, DossierMapper mapper) {
        this.repository = repository;
        this.clientRepository = clientRepository;
        this.mapper = mapper;
    }

    private void linkDocuments(Dossier entity) {
        if (entity.getDocuments() != null) {
            entity.getDocuments().forEach(doc -> {
                doc.setDossier(entity);
                if (doc.getClient() == null && entity.getClientId() != null) {
                    clientRepository.findById(entity.getClientId()).ifPresent(doc::setClient);
                }
            });
        }
    }

    public Page<DossierDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public List<DossierDTO> findAll() {
        return repository.findAll().stream().map(mapper::toDto).collect(Collectors.toList());
    }

    public Page<DossierDTO> search(Predicate predicate, Pageable pageable) {
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public DossierDTO findById(Long id) {
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public DossierDTO create(DossierDTO dto) {
        Dossier entity = mapper.toEntity(dto);
        linkDocuments(entity);
        return mapper.toDto(repository.save(entity));
    }

    public DossierDTO update(DossierDTO dto) {
        Dossier entity = mapper.toEntity(dto);
        linkDocuments(entity);
        return mapper.toDto(repository.save(entity));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
