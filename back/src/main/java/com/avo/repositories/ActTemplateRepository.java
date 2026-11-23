package com.avo.repositories;

import com.avo.entities.ActTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ActTemplateRepository extends JpaRepository<ActTemplate, Long> {
    List<ActTemplate> findByActiveTrueOrderByCategorieAscTitreAsc();
    Optional<ActTemplate> findByCode(String code);
}
