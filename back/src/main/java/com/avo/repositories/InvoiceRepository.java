package com.avo.repositories;

import com.avo.entities.Invoice;
import com.avo.entities.QInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.querydsl.binding.QuerydslBinderCustomizer;
import org.springframework.data.querydsl.binding.QuerydslBindings;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Iterator;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long>, QuerydslPredicateExecutor<Invoice>, QuerydslBinderCustomizer<QInvoice> {
    
    @Override
    default void customize(QuerydslBindings bindings, QInvoice root) {
        bindings.bind(root.issueDate).all((path, value) -> {
            Iterator<? extends LocalDate> it = value.iterator();
            LocalDate from = it.next();
            if (value.size() >= 2) {
                LocalDate to = it.next();
                return Optional.of(path.between(from, to));
            } else {
                return Optional.of(path.goe(from));
            }
        });
    }
    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(t.nbrOfMinutes), 0) FROM Invoice i JOIN i.invoiceTimeEntries t WHERE i.status IN :statuses")
    long sumBilledMinutesByStatuses(@org.springframework.data.repository.query.Param("statuses") java.util.List<com.avo.entities.InvoiceStatusEnum> statuses);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(t.nbrOfMinutes), 0) FROM Invoice i JOIN i.invoiceTimeEntries t WHERE i.status IN :statuses " +
           "AND i.issueDate >= :startDate AND i.issueDate <= :endDate")
    long sumBilledMinutesByStatusesWithDates(@org.springframework.data.repository.query.Param("statuses") java.util.List<com.avo.entities.InvoiceStatusEnum> statuses,
                                           @org.springframework.data.repository.query.Param("startDate") LocalDate startDate,
                                           @org.springframework.data.repository.query.Param("endDate") LocalDate endDate);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(i.subtotalAmount), 0.0) FROM Invoice i WHERE i.status IN :statuses")
    java.math.BigDecimal sumBilledAmountHTByStatuses(@org.springframework.data.repository.query.Param("statuses") java.util.List<com.avo.entities.InvoiceStatusEnum> statuses);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(i.subtotalAmount), 0.0) FROM Invoice i WHERE i.status IN :statuses " +
           "AND i.issueDate >= :startDate AND i.issueDate <= :endDate")
    java.math.BigDecimal sumBilledAmountHTByStatusesWithDates(@org.springframework.data.repository.query.Param("statuses") java.util.List<com.avo.entities.InvoiceStatusEnum> statuses,
                                                            @org.springframework.data.repository.query.Param("startDate") LocalDate startDate,
                                                            @org.springframework.data.repository.query.Param("endDate") LocalDate endDate);
}
