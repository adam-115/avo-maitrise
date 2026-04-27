package com.avo.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import com.avo.entities.ScreeningMatch;

@Repository
public interface ScreeningMatchRepository extends JpaRepository<ScreeningMatch, Long> , QuerydslPredicateExecutor<ScreeningMatch> {
}
