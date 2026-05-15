package com.avo.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.avo.dtos.TaskDTO;
import com.avo.entities.Task;
import com.avo.mappers.TaskMapper;
import com.avo.repositories.TaskRepository;
import com.querydsl.core.types.Predicate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskService {

    private final TaskRepository repository;
    private final TaskMapper mapper;

    public TaskService(TaskRepository repository, TaskMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<TaskDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public List<TaskDTO> findAll() {
        return repository.findAll().stream().map(mapper::toDto).collect(Collectors.toList());
    }

    public Page<TaskDTO> search(Predicate predicate, Pageable pageable) {
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public TaskDTO findById(Long id) {
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public TaskDTO create(TaskDTO dto) {
        Task entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public TaskDTO update(TaskDTO dto) {
        Task entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public List<TaskDTO> findByDossierId(Long dossierId) {
        return repository.findByDossierId(dossierId).stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }
}
