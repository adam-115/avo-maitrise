package com.avo.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;
import com.avo.entities.TaskCategory;

@Repository
public interface TaskCategoryRepository extends JpaRepository<TaskCategory, Long>, QuerydslPredicateExecutor<TaskCategory> {
}
