package com.avo.repositories;

import com.avo.entities.DiligenceFormResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DiligenceFormResultRepository extends JpaRepository<DiligenceFormResult, String>, QuerydslPredicateExecutor<DiligenceFormResult> {
    List<DiligenceFormResult> findByClientId(Long clientId);
    List<DiligenceFormResult> findByFormConfigId(String formConfigId);
}
