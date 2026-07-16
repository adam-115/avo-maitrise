package com.avo.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;
import com.avo.entities.StatutDossier;

@Repository
public interface StatutDossierRepository extends JpaRepository<StatutDossier, Long>, QuerydslPredicateExecutor<StatutDossier> {
    Optional<StatutDossier> findByCode(String code);
}
