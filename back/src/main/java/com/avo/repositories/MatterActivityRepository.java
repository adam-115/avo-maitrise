package com.avo.repositories;

import com.avo.entities.MatterActivity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MatterActivityRepository extends JpaRepository<MatterActivity, Long> {
    List<MatterActivity> findByDossierIdOrderByCreatedAtDesc(Long dossierId);
    Page<MatterActivity> findByDossierIdOrderByCreatedAtDesc(Long dossierId, Pageable pageable);
    Page<MatterActivity> findByDossierIdAndCreatedAtBetweenOrderByCreatedAtDesc(Long dossierId, LocalDateTime start, LocalDateTime end, Pageable pageable);
}
