package com.avo.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;
import com.avo.entities.EventType;

@Repository
public interface EventTypeRepository extends JpaRepository<EventType, Long>, QuerydslPredicateExecutor<EventType> {
}
