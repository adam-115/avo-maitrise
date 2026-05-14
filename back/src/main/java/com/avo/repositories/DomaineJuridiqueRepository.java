package com.avo.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;
import com.avo.entities.DomaineJuridique;

@Repository
public interface DomaineJuridiqueRepository extends JpaRepository<DomaineJuridique, Long>, QuerydslPredicateExecutor<DomaineJuridique> {
}
