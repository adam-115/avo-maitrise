package com.avo.repositories;

import com.avo.entities.ConflictCheck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConflictCheckRepository extends JpaRepository<ConflictCheck, Long> {

    List<ConflictCheck> findByDossierIdOrderByCheckedAtDesc(Long dossierId);

    Optional<ConflictCheck> findTopByDossierIdOrderByCheckedAtDesc(Long dossierId);
}
