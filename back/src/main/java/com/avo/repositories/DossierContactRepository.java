package com.avo.repositories;

import com.avo.entities.DossierContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DossierContactRepository extends JpaRepository<DossierContact, Long>, QuerydslPredicateExecutor<DossierContact> {
    List<DossierContact> findByDossier_Id(Long dossierId);
}
