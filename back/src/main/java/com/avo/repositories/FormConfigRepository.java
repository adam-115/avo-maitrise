package com.avo.repositories;

import com.avo.entities.FormConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface FormConfigRepository extends JpaRepository<FormConfig, String>, QuerydslPredicateExecutor<FormConfig> {
}
