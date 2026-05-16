package com.avo.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.avo.dtos.TaskDTO;
import com.avo.entities.Task;
import com.avo.mappers.TaskMapper;
import com.avo.repositories.TaskRepository;
import com.querydsl.core.types.Predicate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskService {

    private final TaskRepository repository;
    private final TaskMapper mapper;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    public TaskService(TaskRepository repository, TaskMapper mapper, org.springframework.context.ApplicationEventPublisher eventPublisher) {
        this.repository = repository;
        this.mapper = mapper;
        this.eventPublisher = eventPublisher;
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
        Task saved = repository.save(entity);
        
        String author = getCurrentUsername();
        eventPublisher.publishEvent(new com.avo.events.MatterActionEvent(
            this, saved.getDossierId(), author, "Création", "Tâche", saved.getId(), "Tâche créée : " + saved.getTitre()
        ));
        
        return mapper.toDto(saved);
    }

    public TaskDTO update(TaskDTO dto) {
        Task entity = mapper.toEntity(dto);
        Task saved = repository.save(entity);
        
        String author = getCurrentUsername();
        eventPublisher.publishEvent(new com.avo.events.MatterActionEvent(
            this, saved.getDossierId(), author, "Modification", "Tâche", saved.getId(), "Tâche modifiée : " + saved.getTitre()
        ));

        return mapper.toDto(saved);
    }

    private String getCurrentUsername() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null) {
                return authentication.getName();
            }
        } catch (Exception e) {
            // Fallback
        }
        return "Système";
    }

    public void delete(Long id) {
        repository.findById(id).ifPresent(task -> {
            String author = getCurrentUsername();
            eventPublisher.publishEvent(new com.avo.events.MatterActionEvent(
                this, task.getDossierId(), author, "Suppression", "Tâche", task.getId(), "Tâche supprimée : " + task.getTitre()
            ));
            repository.delete(task);
        });
    }

    public List<TaskDTO> findByDossierId(Long dossierId) {
        return repository.findByDossierId(dossierId).stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }
}
