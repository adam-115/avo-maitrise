package com.avo.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;
import com.avo.entities.InvoiceDossierService;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import com.avo.entities.InvoiceDossierServiceStatusEnum;

@Repository
public interface InvoiceDossierServiceRepository extends JpaRepository<InvoiceDossierService, Long>, QuerydslPredicateExecutor<InvoiceDossierService> {

    @Query("SELECT COALESCE(SUM(i.nbrOfMinutes), 0) FROM InvoiceDossierService i WHERE i.status IN :statusList")
    long sumNbrOfMinutesByStatusCodes(@Param("statusList") List<InvoiceDossierServiceStatusEnum> statusList);

    @Query("SELECT COALESCE(SUM(i.nbrOfMinutes), 0) FROM InvoiceDossierService i WHERE i.status IN :statusList " +
           "AND i.creationDate >= :startDate AND i.creationDate <= :endDate")
    long sumNbrOfMinutesByStatusCodesWithDates(@Param("statusList") List<InvoiceDossierServiceStatusEnum> statusList, 
                                               @Param("startDate") java.util.Date startDate, 
                                               @Param("endDate") java.util.Date endDate);

    @Query("SELECT COALESCE(SUM((i.nbrOfMinutes / 5.0) * COALESCE(t.price5min, 0)), 0.0) " +
           "FROM InvoiceDossierService i LEFT JOIN i.invoiceTypeOfService t " +
           "WHERE i.status IN :statusList")
    double sumUnbilledAmountHT(@Param("statusList") List<InvoiceDossierServiceStatusEnum> statusList);

    @Query("SELECT COALESCE(SUM((i.nbrOfMinutes / 5.0) * COALESCE(t.price5min, 0)), 0.0) " +
           "FROM InvoiceDossierService i LEFT JOIN i.invoiceTypeOfService t " +
           "WHERE i.status IN :statusList " +
           "AND i.creationDate >= :startDate AND i.creationDate <= :endDate")
    double sumUnbilledAmountHTWithDates(@Param("statusList") List<InvoiceDossierServiceStatusEnum> statusList,
                                        @Param("startDate") java.util.Date startDate, 
                                        @Param("endDate") java.util.Date endDate);

    @Query("SELECT d.id as dossierId, d.titre as dossierTitre, d.referenceInterne as referenceInterne, c.id as clientId, " +
           "COALESCE(SUM(i.nbrOfMinutes), 0) as unbilledMinutes, " +
           "COALESCE(SUM((i.nbrOfMinutes / 5.0) * COALESCE(t.price5min, 0)), 0.0) as unbilledAmountHT " +
           "FROM InvoiceDossierService i " +
           "JOIN i.dossier d " +
           "LEFT JOIN d.client c " +
           "LEFT JOIN i.invoiceTypeOfService t " +
           "WHERE i.status IN :statusList " +
           "GROUP BY d.id, d.titre, d.referenceInterne, c.id")
    List<UnbilledDossierProjection> getUnbilledDossiersSummary(@Param("statusList") List<InvoiceDossierServiceStatusEnum> statusList);

    @Query("SELECT d.id as dossierId, d.titre as dossierTitre, d.referenceInterne as referenceInterne, c.id as clientId, " +
           "COALESCE(SUM(i.nbrOfMinutes), 0) as unbilledMinutes, " +
           "COALESCE(SUM((i.nbrOfMinutes / 5.0) * COALESCE(t.price5min, 0)), 0.0) as unbilledAmountHT " +
           "FROM InvoiceDossierService i " +
           "JOIN i.dossier d " +
           "LEFT JOIN d.client c " +
           "LEFT JOIN i.invoiceTypeOfService t " +
           "WHERE i.status IN :statusList " +
           "AND i.creationDate >= :startDate AND i.creationDate <= :endDate " +
           "GROUP BY d.id, d.titre, d.referenceInterne, c.id")
    List<UnbilledDossierProjection> getUnbilledDossiersSummaryWithDates(@Param("statusList") List<InvoiceDossierServiceStatusEnum> statusList,
                                                                        @Param("startDate") java.util.Date startDate, 
                                                                        @Param("endDate") java.util.Date endDate);
}
