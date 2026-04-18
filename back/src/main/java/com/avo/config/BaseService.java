package com.avo.config;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.ResponseEntity;
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

    public ResponseEntity<Page<T>> findAll(@NonNull Pageable pageable) {
        return ResponseEntity.ok(jpaRepository.findAll(pageable));
    }

    public ResponseEntity<Page<T>> search(@NonNull Predicate predicate, @NonNull Pageable pageable) {
        return ResponseEntity.ok(querydslPredicateExecutor.findAll(predicate, pageable));
    }

    public ResponseEntity<T> findById(@NonNull ID id) {
        return ResponseEntity.ok(jpaRepository.findById(id).orElse(null));
    }

    public ResponseEntity<T> create(@NonNull T entity) {
        return ResponseEntity.ok(jpaRepository.save(entity));
    }

    public ResponseEntity<T> update(@NonNull T entity) {
        return ResponseEntity.ok(jpaRepository.save(entity));
    }

}
