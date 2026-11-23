package com.avo.repositories;

import com.avo.entities.DossierDeadline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DossierDeadlineRepository extends JpaRepository<DossierDeadline, Long> {
    List<DossierDeadline> findByDossierIdOrderByDateEcheanceFinaleAsc(Long dossierId);
    List<DossierDeadline> findByStatutOrderByDateEcheanceFinaleAsc(String statut);
    List<DossierDeadline> findByStatutAndDateEcheanceFinaleLessThanEqualOrderByDateEcheanceFinaleAsc(
            String statut, LocalDate maxDate);
}
