package com.avo.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;
import com.avo.entities.Dossier;

@Repository
public interface DossierRepository extends JpaRepository<Dossier, Long>, QuerydslPredicateExecutor<Dossier> {
}
