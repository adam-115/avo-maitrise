package com.avo.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.avo.dtos.UserDTO;
import com.avo.entities.AppUser;
import com.avo.mappers.UserMapper;
import com.avo.repositories.UserRepository;
import com.querydsl.core.types.Predicate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository repository;
    private final UserMapper mapper;

    public UserService(UserRepository repository, UserMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<UserDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toDto);
    }

    public List<UserDTO> findAll() {
        return repository.findAll().stream().map(mapper::toDto).collect(Collectors.toList());
    }

    public Page<UserDTO> search(Predicate predicate, Pageable pageable) {
        return repository.findAll(predicate, pageable).map(mapper::toDto);
    }

    public UserDTO findById(Long id) {
        return repository.findById(id).map(mapper::toDto).orElse(null);
    }

    public UserDTO create(UserDTO dto) {
        AppUser entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public UserDTO update(UserDTO dto) {
        AppUser entity = mapper.toEntity(dto);
        return mapper.toDto(repository.save(entity));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
