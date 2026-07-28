package com.avo.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.querydsl.binding.QuerydslBinderCustomizer;
import org.springframework.data.querydsl.binding.QuerydslBindings;
import org.springframework.stereotype.Repository;

import com.avo.entities.QScreeningMatch;
import com.avo.entities.ScreeningMatch;

@Repository
public interface ScreeningMatchRepository extends JpaRepository<ScreeningMatch, Long> , QuerydslPredicateExecutor<ScreeningMatch>, QuerydslBinderCustomizer<QScreeningMatch> {

    @Override
    default void customize(QuerydslBindings bindings, QScreeningMatch root) {
        bindings.bind(root.client.id).first((path, value) -> path.eq(value));
        bindings.bind(root.ubo.id).first((path, value) -> path.eq(value));
        bindings.bind(root.screeningExecution.id).first((path, value) -> path.eq(value));
    }

    @org.springframework.data.jpa.repository.Query("SELECT m FROM ScreeningMatch m WHERE m.client.id = :clientId")
    org.springframework.data.domain.Page<com.avo.entities.ScreeningMatch> findPageByClientId(@org.springframework.data.repository.query.Param("clientId") Long clientId, org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT m FROM ScreeningMatch m WHERE m.ubo.id = :uboId")
    org.springframework.data.domain.Page<com.avo.entities.ScreeningMatch> findPageByUboId(@org.springframework.data.repository.query.Param("uboId") Long uboId, org.springframework.data.domain.Pageable pageable);

    java.util.List<com.avo.entities.ScreeningMatch> findByClientId(Long clientId);
    java.util.List<com.avo.entities.ScreeningMatch> findByUboId(Long uboId);
    java.util.List<com.avo.entities.ScreeningMatch> findByScreeningExecutionId(Long executionId);
    
    java.util.Optional<com.avo.entities.ScreeningMatch> findFirstByClientIdAndYenteIdOrderByCreatedAtDesc(Long clientId, String yenteId);
    java.util.Optional<com.avo.entities.ScreeningMatch> findFirstByUboIdAndYenteIdOrderByCreatedAtDesc(Long uboId, String yenteId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query("delete from ScreeningMatch m where m.client.id not in (select c.id from ClientEntity c)")
    void deleteOrphanedMatches();
}
