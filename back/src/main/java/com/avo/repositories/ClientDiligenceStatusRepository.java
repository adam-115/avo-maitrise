package com.avo.repositories;

import com.avo.entities.ClientDiligenceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClientDiligenceStatusRepository extends JpaRepository<ClientDiligenceStatus, String>, QuerydslPredicateExecutor<ClientDiligenceStatus> {
    List<ClientDiligenceStatus> findByClientId(Long clientId);
    Optional<ClientDiligenceStatus> findByClientIdAndFormConfigId(Long clientId, String formConfigId);
}
