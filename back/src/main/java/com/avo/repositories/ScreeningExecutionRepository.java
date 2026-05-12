package com.avo.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import com.avo.entities.ScreeningExecution;

@Repository
public interface ScreeningExecutionRepository extends JpaRepository<ScreeningExecution, Long>,
        QuerydslPredicateExecutor<ScreeningExecution> {
    java.util.Optional<com.avo.entities.ScreeningExecution> findFirstByClientIdOrderByCreatedAtDesc(Long clientId);
    java.util.Optional<com.avo.entities.ScreeningExecution> findFirstByUboIdOrderByCreatedAtDesc(Long uboId);
}
