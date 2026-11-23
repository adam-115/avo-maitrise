package com.avo.repositories;

import com.avo.entities.DeadlineAlertLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeadlineAlertLogRepository extends JpaRepository<DeadlineAlertLog, Long> {
    boolean existsByDeadlineIdAndAlertStage(Long deadlineId, String alertStage);
}
