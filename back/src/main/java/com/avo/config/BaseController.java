package com.avo.config;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.querydsl.core.types.Predicate;
import com.querydsl.core.types.EntityPath;

public abstract class BaseController<T, Q extends EntityPath<?>, ID> {

    final private BaseService<T, Q, ID> baseService;

    protected BaseController(JpaRepository<T, ID> jpaRepository,
            QuerydslPredicateExecutor<T> querydslPredicateExecutor) {
        this.baseService = new BaseService<>(jpaRepository, querydslPredicateExecutor);
    }

    @GetMapping
    public ResponseEntity<Page<T>> findAll(Pageable pageable) {
        return baseService.findAll(pageable);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<T>> search(@QuerydslPredicate Predicate predicate, Pageable pageable) {
        return baseService.search(predicate, pageable);
    }

    @GetMapping("/{id}")
    public ResponseEntity<T> findById(@PathVariable ID id) {
        return baseService.findById(id);
    }

    @PostMapping
    public ResponseEntity<T> create(@RequestBody T entity) {
        return baseService.create(entity);
    }

    @PutMapping
    public ResponseEntity<T> update(@RequestBody T entity) {
        return baseService.update(entity);
    }

}
