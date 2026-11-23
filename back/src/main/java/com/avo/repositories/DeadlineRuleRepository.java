package com.avo.repositories;

import com.avo.entities.DeadlineRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeadlineRuleRepository extends JpaRepository<DeadlineRule, Long> {
    List<DeadlineRule> findByActiveTrueOrderByPaysAscCategorieAscLibelleAsc();
    List<DeadlineRule> findByPaysIgnoreCaseAndActiveTrueOrderByCategorieAscLibelleAsc(String pays);
    Optional<DeadlineRule> findByCode(String code);
}
