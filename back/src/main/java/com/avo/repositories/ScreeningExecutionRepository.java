package com.avo.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.querydsl.binding.QuerydslBinderCustomizer;
import org.springframework.data.querydsl.binding.QuerydslBindings;
import org.springframework.stereotype.Repository;

import com.avo.entities.QScreeningExecution;
import com.avo.entities.ScreeningExecution;

@Repository
public interface ScreeningExecutionRepository extends JpaRepository<ScreeningExecution, Long>,
        QuerydslPredicateExecutor<ScreeningExecution>, QuerydslBinderCustomizer<QScreeningExecution> {

    @Override
    default void customize(QuerydslBindings bindings, QScreeningExecution root) {
        bindings.bind(root.client.id).first((path, value) -> path.eq(value));
        bindings.bind(root.ubo.id).first((path, value) -> path.eq(value));
    }

    @org.springframework.data.jpa.repository.Query("SELECT e FROM ScreeningExecution e WHERE e.client.id = :clientId")
    org.springframework.data.domain.Page<com.avo.entities.ScreeningExecution> findPageByClientId(@org.springframework.data.repository.query.Param("clientId") Long clientId, org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT e FROM ScreeningExecution e WHERE e.ubo.id = :uboId")
    org.springframework.data.domain.Page<com.avo.entities.ScreeningExecution> findPageByUboId(@org.springframework.data.repository.query.Param("uboId") Long uboId, org.springframework.data.domain.Pageable pageable);

    java.util.Optional<com.avo.entities.ScreeningExecution> findFirstByClientIdOrderByCreatedAtDesc(Long clientId);
    java.util.Optional<com.avo.entities.ScreeningExecution> findFirstByUboIdOrderByCreatedAtDesc(Long uboId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query("delete from ScreeningExecution e where e.ubo.id = :uboId")
    void deleteByUboId(@org.springframework.data.repository.query.Param("uboId") Long uboId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query("delete from ScreeningExecution e where e.client.id = :clientId")
    void deleteByClientId(@org.springframework.data.repository.query.Param("clientId") Long clientId);
}
