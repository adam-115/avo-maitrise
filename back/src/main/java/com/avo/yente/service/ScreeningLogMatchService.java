package com.avo.yente.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.avo.config.IBaseService;
import com.avo.entities.ScreeningLogMatch;
import com.avo.repositories.ScreeningLogMatchRepository;
import com.querydsl.core.types.EntityPath;
import com.querydsl.core.types.Predicate;

import lombok.NonNull;

@Service
public class ScreeningLogMatchService
        implements IBaseService<ScreeningLogMatch, EntityPath<ScreeningLogMatch>, Long> {

    private final ScreeningLogMatchRepository screeningLogMatchRepository;

    public ScreeningLogMatchService(ScreeningLogMatchRepository screeningLogMatchRepository) {
        this.screeningLogMatchRepository = screeningLogMatchRepository;
    }

    @Override
    public Page<ScreeningLogMatch> findAll(@NonNull final Pageable pageable) {
        return screeningLogMatchRepository.findAll(pageable);
    }

    @Override
    public Page<ScreeningLogMatch> search(@NonNull final Predicate predicate,
            @NonNull final Pageable pageable) {
        return screeningLogMatchRepository.findAll(predicate, pageable);
    }

    @Override
    public ScreeningLogMatch findById(@NonNull final Long id) {
        return screeningLogMatchRepository.findById(id).orElse(null);
    }

    @Override
    public ScreeningLogMatch create(@NonNull final ScreeningLogMatch entity) {
        return screeningLogMatchRepository.save(entity);
    }

    @Override
    public ScreeningLogMatch update(@NonNull final ScreeningLogMatch entity) {
        throw new RuntimeException("this method is not allowed ");
    }

    
    

}
