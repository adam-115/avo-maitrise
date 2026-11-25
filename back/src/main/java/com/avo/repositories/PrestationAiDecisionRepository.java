package com.avo.repositories;

import com.avo.entities.PrestationAiDecision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PrestationAiDecisionRepository extends JpaRepository<PrestationAiDecision, Long> {

    List<PrestationAiDecision> findByDossierId(Long dossierId);

    Optional<PrestationAiDecision> findByDossierIdAndSourceKey(Long dossierId, String sourceKey);

    void deleteByDossierIdAndDecision(Long dossierId, String decision);
}
