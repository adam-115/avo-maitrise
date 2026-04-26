package com.avo.config;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.lang.NonNull;

import com.querydsl.core.types.EntityPath;
import com.querydsl.core.types.Predicate;

public interface IBaseService<T, Q extends EntityPath<?>, ID> {

    Page<T> findAll(@NonNull Pageable pageable);

    Page<T> search(@NonNull Predicate predicate, @NonNull Pageable pageable);

    T findById(@NonNull ID id);

    T create(@NonNull T entity);

    T update(@NonNull T entity);
}
