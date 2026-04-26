package com.avo.config;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.lang.NonNull;

import com.querydsl.core.types.Predicate;
import com.querydsl.core.types.EntityPath;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;

public class BaseService<T, Q extends EntityPath<?>, ID> implements IBaseService<T, Q, ID> {

    private final JpaRepository<T, ID> jpaRepository;
    private final QuerydslPredicateExecutor<T> querydslPredicateExecutor;

    public BaseService(JpaRepository<T, ID> jpaRepository, QuerydslPredicateExecutor<T> querydslPredicateExecutor) {
        this.jpaRepository = jpaRepository;
        this.querydslPredicateExecutor = querydslPredicateExecutor;
    }

    public Page<T> findAll(@NonNull Pageable pageable) {
        return jpaRepository.findAll(pageable);
    }

    public Page<T> search(@NonNull Predicate predicate, @NonNull Pageable pageable) {
        return querydslPredicateExecutor.findAll(predicate, pageable);
    }

    public T findById(@NonNull ID id) {
        return jpaRepository.findById(id).orElse(null);
    }

    public T create(@NonNull T entity) {
        return jpaRepository.save(entity);
    }

    public T update(@NonNull T entity) {
        return jpaRepository.save(entity);
    }

}
