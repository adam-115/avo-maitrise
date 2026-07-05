package com.avo.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.avo.dtos.TaskLogDTO;
import com.avo.entities.TaskLog;
import com.avo.mappers.TaskLogMapper;
import com.avo.repositories.TaskLogRepository;
import com.querydsl.core.types.Predicate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class TaskLogService {

    private final TaskLogRepository repository;
    private final TaskLogMapper mapper;

    public TaskLogService(TaskLogRepository repository, TaskLogMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<TaskLogDTO> findAll(Pageable pageable) {
        log.info("[ENTER] Executing findAll");
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public List<TaskLogDTO> findAll() {
        log.info("[ENTER] Executing findAll");
        return repository.findAll().stream().map(mapper::toDto).collect(Collectors.toList());
    }

    public Page<TaskLogDTO> search(Predicate predicate, Pageable pageable) {
        log.info("[ENTER] Executing search");
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public TaskLogDTO findById(Long id) {
        log.info("[ENTER] Executing findById");
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public TaskLogDTO create(TaskLogDTO dto) {
        log.info("[ENTER] Executing create");
        TaskLog entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public void delete(Long id) {
        log.info("[ENTER] Executing delete");
        repository.deleteById(id);
    }

    public List<TaskLogDTO> findByTaskId(Long taskId) {
        log.info("[ENTER] Executing findByTaskId");
        return repository.findByTaskId(taskId).stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }
}
