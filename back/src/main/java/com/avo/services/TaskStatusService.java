package com.avo.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.avo.dtos.TaskStatusDTO;
import com.avo.entities.TaskStatus;
import com.avo.mappers.TaskStatusMapper;
import com.avo.repositories.TaskStatusRepository;
import com.querydsl.core.types.Predicate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class TaskStatusService {

    private final TaskStatusRepository repository;
    private final TaskStatusMapper mapper;

    public TaskStatusService(TaskStatusRepository repository, TaskStatusMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<TaskStatusDTO> findAll(Pageable pageable) {
        log.info("[ENTER] Executing findAll");
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public List<TaskStatusDTO> findAll() {
        log.info("[ENTER] Executing findAll");
        return repository.findAll().stream().map(mapper::toDto).collect(Collectors.toList());
    }

    public Page<TaskStatusDTO> search(Predicate predicate, Pageable pageable) {
        log.info("[ENTER] Executing search");
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public TaskStatusDTO findById(Long id) {
        log.info("[ENTER] Executing findById");
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public TaskStatusDTO create(TaskStatusDTO dto) {
        log.info("[ENTER] Executing create");
        TaskStatus entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public TaskStatusDTO update(TaskStatusDTO dto) {
        log.info("[ENTER] Executing update");
        TaskStatus entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public void delete(Long id) {
        log.info("[ENTER] Executing delete");
        repository.deleteById(id);
    }
}
