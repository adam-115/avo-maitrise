package com.avo.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import com.avo.entities.ClientEntity;
import com.querydsl.core.types.Predicate;

@Repository
public interface ClientRepository extends JpaRepository<ClientEntity, Long> , QuerydslPredicateExecutor<ClientEntity> {

    Page<ClientEntity> findAll(Pageable pageable);
    Page<ClientEntity> findAll(Predicate predicate, Pageable pageable);

}
