package com.avo.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import com.avo.entities.UBO;

@Repository
public interface UBORepository extends JpaRepository<UBO, Long> , QuerydslPredicateExecutor<UBO> {
}
