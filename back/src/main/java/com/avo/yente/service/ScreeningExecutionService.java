package com.avo.yente.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.avo.entities.ScreeningExecution;
import com.avo.dtos.ScreeningExecutionDTO;
import com.avo.mappers.ScreeningExecutionMapper;
import com.avo.repositories.ScreeningExecutionRepository;
import com.avo.repositories.ClientRepository;
import com.avo.repositories.UBORepository;
import com.querydsl.core.types.Predicate;

@Service
@Slf4j
public class ScreeningExecutionService {

    private final ScreeningExecutionRepository screeningExecutionRepository;
    private final ScreeningExecutionMapper mapper;
    private final ClientRepository clientRepository;
    private final UBORepository uboRepository;
    
    public ScreeningExecutionService(ScreeningExecutionRepository screeningExecutionRepository, 
                                     ScreeningExecutionMapper mapper,
                                     ClientRepository clientRepository,
                                     UBORepository uboRepository) {
        this.screeningExecutionRepository = screeningExecutionRepository;
        this.mapper = mapper;
        this.clientRepository = clientRepository;
        this.uboRepository = uboRepository;
    }

    public Page<ScreeningExecutionDTO> findAll(Pageable pageable) {
        log.info("[ENTER] Executing findAll");
        return screeningExecutionRepository.findAll(pageable).map(mapper::toDto);
    }

    public Page<ScreeningExecutionDTO> search(Predicate predicate, Pageable pageable) {
        log.info("[ENTER] Executing search");
        return screeningExecutionRepository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public ScreeningExecutionDTO findById(Long id) {
        log.info("[ENTER] Executing findById");
        return screeningExecutionRepository.findById(id).map(mapper::toDto).orElse(null);
    }

    public ScreeningExecutionDTO create(ScreeningExecutionDTO dto) {
        log.info("[ENTER] Executing create");
        ScreeningExecution entity = mapper.toEntity(dto);
        
        // Fetch managed client and UBO from DB to avoid PropertyValueException or transient state errors
        if (dto.getClientEntityDTO() != null && dto.getClientEntityDTO().getId() != null) {
            entity.setClient(clientRepository.findById(dto.getClientEntityDTO().getId()).orElse(null));
        } else if (dto.getUboDTO() != null && dto.getUboDTO().getClientMoralId() != null) {
            entity.setClient(clientRepository.findById(dto.getUboDTO().getClientMoralId()).orElse(null));
        }
        
        if (dto.getUboDTO() != null && dto.getUboDTO().getId() != null) {
            entity.setUbo(uboRepository.findById(dto.getUboDTO().getId()).orElse(null));
        }
        
        return mapper.toDto(screeningExecutionRepository.save(entity));
    }

    public ScreeningExecutionDTO update(ScreeningExecutionDTO dto) {
        log.info("[ENTER] Executing update");
        throw new RuntimeException("this method is not allowed ");
    }
    
    public Page<ScreeningExecutionDTO> findByClientId(Long clientId, Pageable pageable) {
        log.info("[ENTER] Executing findByClientId for client: {}", clientId);
        return screeningExecutionRepository.findPageByClientId(clientId, pageable).map(mapper::toDto);
    }

    public Page<ScreeningExecutionDTO> findByUboId(Long uboId, Pageable pageable) {
        log.info("[ENTER] Executing findByUboId for ubo: {}", uboId);
        return screeningExecutionRepository.findPageByUboId(uboId, pageable).map(mapper::toDto);
    }

    public void delete(Long id) {
        log.info("[ENTER] Executing delete");
        screeningExecutionRepository.deleteById(id);
    }
}
