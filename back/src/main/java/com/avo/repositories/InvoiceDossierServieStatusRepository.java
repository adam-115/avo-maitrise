package com.avo.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;
import com.avo.entities.InvoiceDossierServieStatus;

@Repository
public interface InvoiceDossierServieStatusRepository extends JpaRepository<InvoiceDossierServieStatus, Long>, QuerydslPredicateExecutor<InvoiceDossierServieStatus> {
}
