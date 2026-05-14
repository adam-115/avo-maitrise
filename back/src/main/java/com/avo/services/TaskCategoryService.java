package com.avo.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.avo.dtos.TaskCategoryDTO;
import com.avo.entities.TaskCategory;
import com.avo.mappers.TaskCategoryMapper;
import com.avo.repositories.TaskCategoryRepository;
import com.querydsl.core.types.Predicate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskCategoryService {

    private final TaskCategoryRepository repository;
    private final TaskCategoryMapper mapper;

    public TaskCategoryService(TaskCategoryRepository repository, TaskCategoryMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<TaskCategoryDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public List<TaskCategoryDTO> findAll() {
        return repository.findAll().stream().map(mapper::toDto).collect(Collectors.toList());
    }

    public Page<TaskCategoryDTO> search(Predicate predicate, Pageable pageable) {
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public TaskCategoryDTO findById(Long id) {
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public TaskCategoryDTO create(TaskCategoryDTO dto) {
        TaskCategory entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public TaskCategoryDTO update(TaskCategoryDTO dto) {
        TaskCategory entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
