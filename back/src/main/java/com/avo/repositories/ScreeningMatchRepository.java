package com.avo.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import com.avo.entities.ScreeningMatch;

@Repository
public interface ScreeningMatchRepository extends JpaRepository<ScreeningMatch, Long> , QuerydslPredicateExecutor<ScreeningMatch> {
    java.util.List<com.avo.entities.ScreeningMatch> findByClientId(Long clientId);
    java.util.List<com.avo.entities.ScreeningMatch> findByUboId(Long uboId);
    
    java.util.Optional<com.avo.entities.ScreeningMatch> findFirstByClientIdAndYenteIdOrderByCreatedAtDesc(Long clientId, String yenteId);
    java.util.Optional<com.avo.entities.ScreeningMatch> findFirstByUboIdAndYenteIdOrderByCreatedAtDesc(Long uboId, String yenteId);
}
