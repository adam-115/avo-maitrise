package com.avo.repositories;

import com.avo.entities.SecteurActivite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface SecteurActiviteRepository extends JpaRepository<SecteurActivite, Long>, QuerydslPredicateExecutor<SecteurActivite> {
}
