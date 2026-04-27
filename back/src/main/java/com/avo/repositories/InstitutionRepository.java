package com.avo.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import com.avo.entities.Institution;

@Repository
public interface InstitutionRepository extends JpaRepository<Institution, Long>, QuerydslPredicateExecutor<Institution> {

}
