package com.avo.repositories;

import com.avo.entities.MatterEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MatterEventRepository extends JpaRepository<MatterEvent, Long>, QuerydslPredicateExecutor<MatterEvent> {
    List<MatterEvent> findByDossierId(Long dossierId);
}
