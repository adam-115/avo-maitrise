package com.avo.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import com.avo.entities.ContactPoint;

@Repository
public interface ContactPointRepository extends JpaRepository<ContactPoint, Long>, QuerydslPredicateExecutor<ContactPoint> {
}
