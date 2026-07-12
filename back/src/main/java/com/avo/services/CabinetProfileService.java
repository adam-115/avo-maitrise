package com.avo.services;

import java.util.List;

import org.springframework.stereotype.Service;

import com.avo.dtos.CabinetProfileDTO;
import com.avo.entities.CabinetProfile;
import com.avo.mappers.CabinetProfileMapper;
import com.avo.repositories.CabinetProfileRepository;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class CabinetProfileService {

    private final CabinetProfileRepository repository;
    private final CabinetProfileMapper mapper;

    public CabinetProfileService(CabinetProfileRepository repository, CabinetProfileMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public CabinetProfileDTO getProfile() {
        log.info("[ENTER] Executing getProfile");
        List<CabinetProfile> profiles = repository.findAll();
        if (profiles.isEmpty()) {
            return new CabinetProfileDTO();
        }
        return mapper.toDto(profiles.get(0));
    }

    public CabinetProfileDTO updateProfile(CabinetProfileDTO dto) {
        log.info("[ENTER] Executing updateProfile");
        CabinetProfile entity;
        List<CabinetProfile> profiles = repository.findAll();
        
        if (profiles.isEmpty()) {
            entity = mapper.toEntity(dto);
        } else {
            CabinetProfile existing = profiles.get(0);
            entity = mapper.toEntity(dto);
            entity.setId(existing.getId()); // preserve ID to update existing record
            
            // If the DTO doesn't include a logo but existing has one, we should probably preserve it unless explicitly cleared.
            // This depends on the exact logic desired. For now, assume mapper sets all.
            if (dto.getLogo() == null && existing.getLogo() != null) {
                entity.setLogo(existing.getLogo());
                entity.setLogoContentType(existing.getLogoContentType());
            }
        }
        
        return mapper.toDto(repository.save(entity));
    }
}
