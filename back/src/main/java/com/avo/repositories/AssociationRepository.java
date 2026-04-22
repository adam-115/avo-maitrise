package com.avo.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import com.avo.entities.Association;

@Repository
public interface AssociationRepository extends JpaRepository<Association, Long>, QuerydslPredicateExecutor<Association> {

}
