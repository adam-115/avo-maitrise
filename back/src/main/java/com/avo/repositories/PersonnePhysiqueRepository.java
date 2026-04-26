package com.avo.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import com.avo.entities.ClientPersonnePhysique;

@Repository
public interface PersonnePhysiqueRepository extends JpaRepository<ClientPersonnePhysique, Long> , QuerydslPredicateExecutor<ClientPersonnePhysique> {

}
