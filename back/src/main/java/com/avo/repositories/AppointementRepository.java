package com.avo.repositories;

import com.avo.entities.Appointement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AppointementRepository extends JpaRepository<Appointement, Long>, QuerydslPredicateExecutor<Appointement> {
    List<Appointement> findByDossier_Id(Long dossierId);

    Optional<Appointement> findByExternalCalendarEventId(String externalCalendarEventId);

    List<Appointement> findByExternalCalendarEventIdIsNull();
}
