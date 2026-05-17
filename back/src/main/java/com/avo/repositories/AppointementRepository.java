package com.avo.repositories;

import com.avo.entities.Appointement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface AppointementRepository extends JpaRepository<Appointement, Long>, QuerydslPredicateExecutor<Appointement> {
}
