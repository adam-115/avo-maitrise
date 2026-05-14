package com.avo.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;
import com.avo.entities.DossierPriorite;

@Repository
public interface DossierPrioriteRepository extends JpaRepository<DossierPriorite, Long>, QuerydslPredicateExecutor<DossierPriorite> {
}
