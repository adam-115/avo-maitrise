package com.avo.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import com.avo.entities.ScreeningLogMatch;

@Repository
public interface ScreeningLogMatchRepository extends JpaRepository<ScreeningLogMatch, Long>,
        QuerydslPredicateExecutor<ScreeningLogMatch> {
}
