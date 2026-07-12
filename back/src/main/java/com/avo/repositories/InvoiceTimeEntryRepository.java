package com.avo.repositories;

import com.avo.entities.InvoiceTimeEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface InvoiceTimeEntryRepository extends JpaRepository<InvoiceTimeEntry, Long>, QuerydslPredicateExecutor<InvoiceTimeEntry> {
}
