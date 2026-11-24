package com.avo.repositories;

import com.avo.entities.MailIntegrationConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MailIntegrationConfigRepository extends JpaRepository<MailIntegrationConfig, Long> {
}
