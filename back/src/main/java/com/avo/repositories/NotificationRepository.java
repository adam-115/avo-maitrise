package com.avo.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.avo.entities.Notification;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByClientIdOrderByCreatedAtDesc(Long clientId);
    List<Notification> findByIsReadFalseOrderByCreatedAtDesc();
}
