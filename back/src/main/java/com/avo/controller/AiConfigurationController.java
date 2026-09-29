package com.avo.controller;

import com.avo.dtos.AiConfigurationDTO;
import com.avo.entities.AiConfiguration;
import com.avo.mappers.AiConfigurationMapper;
import com.avo.repositories.AiConfigurationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ai-configuration")
public class AiConfigurationController {

    private final AiConfigurationRepository repository;
    private final AiConfigurationMapper mapper;

    public AiConfigurationController(AiConfigurationRepository repository, AiConfigurationMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @GetMapping
    public ResponseEntity<List<AiConfigurationDTO>> getAllConfigurations() {
        return ResponseEntity.ok(repository.findAll().stream()
                .map(mapper::toDto)
                .collect(Collectors.toList()));
    }

    @GetMapping("/active")
    public ResponseEntity<AiConfigurationDTO> getActiveConfiguration() {
        return repository.findByIsActiveTrue()
                .map(mapper::toDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status")
    public ResponseEntity<Boolean> getAiStatus() {
        return ResponseEntity.ok(repository.findByIsActiveTrue().isPresent());
    }

    @PostMapping
    public ResponseEntity<AiConfigurationDTO> saveConfiguration(@RequestBody AiConfigurationDTO dto) {
        AiConfiguration entity = mapper.toEntity(dto);
        entity.setUpdatedAt(new Date());

        // Si on l'active, on désactive les autres
        if (Boolean.TRUE.equals(entity.getIsActive())) {
            repository.findAll().forEach(conf -> {
                if (!conf.getId().equals(entity.getId())) {
                    conf.setIsActive(false);
                    repository.save(conf);
                }
            });
        }

        return ResponseEntity.ok(mapper.toDto(repository.save(entity)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AiConfigurationDTO> updateConfiguration(@PathVariable Long id,
            @RequestBody AiConfigurationDTO dto) {
        return repository.findById(id).map(existing -> {
            existing.setProvider(dto.getProvider());
            existing.setModelName(dto.getModelName());
            existing.setApiKey(dto.getApiKey());
            existing.setBaseUrl(dto.getBaseUrl());
            existing.setTemperature(dto.getTemperature());
            existing.setTimeoutMinutes(dto.getTimeoutMinutes());
            existing.setUpdatedAt(new Date());

            if (Boolean.TRUE.equals(dto.getIsActive())) {
                existing.setIsActive(true);
                repository.findAll().forEach(conf -> {
                    if (!conf.getId().equals(id)) {
                        conf.setIsActive(false);
                        repository.save(conf);
                    }
                });
            } else {
                existing.setIsActive(false);
            }

            return ResponseEntity.ok(mapper.toDto(repository.save(existing)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConfiguration(@PathVariable Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
