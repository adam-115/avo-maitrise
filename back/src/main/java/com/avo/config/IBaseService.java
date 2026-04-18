package com.avo.config;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;

import com.querydsl.core.types.Predicate;
import com.querydsl.core.types.EntityPath;

public interface IBaseService<T, Q extends EntityPath<?>, ID> {

    ResponseEntity<Page<T>> findAll(@NonNull Pageable pageable);

    ResponseEntity<Page<T>> search(@NonNull Predicate predicate, @NonNull Pageable pageable);

    ResponseEntity<T> findById(@NonNull ID id);

    ResponseEntity<T> create(@NonNull T entity);

    ResponseEntity<T> update(@NonNull T entity);
}
