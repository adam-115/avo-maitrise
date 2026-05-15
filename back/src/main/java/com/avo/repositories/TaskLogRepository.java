package com.avo.repositories;

import com.avo.entities.TaskLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskLogRepository extends JpaRepository<TaskLog, Long>, QuerydslPredicateExecutor<TaskLog> {
    List<TaskLog> findByTaskId(Long taskId);
}
