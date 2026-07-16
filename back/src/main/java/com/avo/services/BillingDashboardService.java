package com.avo.services;

import com.avo.entities.InvoiceDossierServiceStatusEnum;
import com.avo.entities.StatutDossier;
import com.avo.repositories.DossierRepository;
import com.avo.repositories.StatutDossierRepository;
import com.avo.repositories.InvoiceDossierServiceRepository;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import com.avo.dtos.UnbilledDossierSummaryDTO;
import com.avo.repositories.UnbilledDossierProjection;
import com.avo.repositories.ClientRepository;
import com.avo.entities.ClientEntity;
import com.avo.entities.ClientPersonnePhysique;
import com.avo.entities.ClientMoral;
import com.avo.entities.Association;
import com.avo.entities.Institution;

@Service
public class BillingDashboardService {

    private final DossierRepository dossierRepository;
    private final StatutDossierRepository statutDossierRepository;
    private final InvoiceDossierServiceRepository invoiceDossierServiceRepository;
    private final ClientRepository clientRepository;
    private final com.avo.repositories.InvoiceRepository invoiceRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public BillingDashboardService(DossierRepository dossierRepository, 
                                   StatutDossierRepository statutDossierRepository,
                                   InvoiceDossierServiceRepository invoiceDossierServiceRepository,
                                   ClientRepository clientRepository,
                                   com.avo.repositories.InvoiceRepository invoiceRepository,
                                   org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        this.dossierRepository = dossierRepository;
        this.statutDossierRepository = statutDossierRepository;
        this.invoiceDossierServiceRepository = invoiceDossierServiceRepository;
        this.clientRepository = clientRepository;
        this.invoiceRepository = invoiceRepository;
        this.jdbcTemplate = jdbcTemplate;
        // Temporary fix for null statuses
        try {
            jdbcTemplate.update("UPDATE invoice_dossier_services SET status = 'A_FACTURE' WHERE status IS NULL");
        } catch (Exception e) {
            System.err.println("Could not update null statuses: " + e.getMessage());
        }
    }

    public long getActiveClientsCount() {
        Optional<StatutDossier> termineStatutOpt = statutDossierRepository.findByCode("TERMINE");
        
        if (termineStatutOpt.isEmpty()) {
            return dossierRepository.countDistinctClientId();
        }
        
        String termineId = String.valueOf(termineStatutOpt.get().getId());
        return dossierRepository.countDistinctClientIdByStatutIDNotIn(List.of(termineId));
    }

    public long getActiveDossiersCount() {
        Optional<StatutDossier> termineStatutOpt = statutDossierRepository.findByCode("TERMINE");
        
        if (termineStatutOpt.isEmpty()) {
            return dossierRepository.count();
        }
        
        String termineId = String.valueOf(termineStatutOpt.get().getId());
        return dossierRepository.countByStatutIDNotIn(List.of(termineId));
    }

    public long getUnbilledMinutes(java.util.Date startDate, java.util.Date endDate) {
        if (startDate != null && endDate != null) {
            return invoiceDossierServiceRepository.sumNbrOfMinutesByStatusCodesWithDates(Arrays.asList(InvoiceDossierServiceStatusEnum.A_FACTURE), startDate, endDate);
        }
        return invoiceDossierServiceRepository.sumNbrOfMinutesByStatusCodes(Arrays.asList(InvoiceDossierServiceStatusEnum.A_FACTURE));
    }

    public long getBilledMinutes(java.util.Date startDate, java.util.Date endDate) {
        if (startDate != null && endDate != null) {
            java.time.LocalDate start = startDate.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate();
            java.time.LocalDate end = endDate.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate();
            return invoiceRepository.sumBilledMinutesByStatusesWithDates(Arrays.asList(com.avo.entities.InvoiceStatusEnum.PAID), start, end);
        }
        return invoiceRepository.sumBilledMinutesByStatuses(Arrays.asList(com.avo.entities.InvoiceStatusEnum.PAID));
    }

    public double getUnbilledAmountHT(java.util.Date startDate, java.util.Date endDate) {
        Double sum;
        if (startDate != null && endDate != null) {
            sum = invoiceDossierServiceRepository.sumUnbilledAmountHTWithDates(Arrays.asList(InvoiceDossierServiceStatusEnum.A_FACTURE), startDate, endDate);
        } else {
            sum = invoiceDossierServiceRepository.sumUnbilledAmountHT(Arrays.asList(InvoiceDossierServiceStatusEnum.A_FACTURE));
        }
        return sum != null ? sum : 0.0;
    }

    public double getBilledAmountHT(java.util.Date startDate, java.util.Date endDate) {
        java.math.BigDecimal sum;
        if (startDate != null && endDate != null) {
            java.time.LocalDate start = startDate.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate();
            java.time.LocalDate end = endDate.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate();
            sum = invoiceRepository.sumBilledAmountHTByStatusesWithDates(Arrays.asList(com.avo.entities.InvoiceStatusEnum.PAID), start, end);
        } else {
            sum = invoiceRepository.sumBilledAmountHTByStatuses(Arrays.asList(com.avo.entities.InvoiceStatusEnum.PAID));
        }
        return sum != null ? sum.doubleValue() : 0.0;
    }

    public double getBilledAmountTTC(java.util.Date startDate, java.util.Date endDate) {
        return getBilledAmountHT(startDate, endDate) * 1.20;
    }

    public long getPendingMinutes(java.util.Date startDate, java.util.Date endDate) {
        if (startDate != null && endDate != null) {
            java.time.LocalDate start = startDate.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate();
            java.time.LocalDate end = endDate.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate();
            return invoiceRepository.sumBilledMinutesByStatusesWithDates(Arrays.asList(com.avo.entities.InvoiceStatusEnum.DRAFT, com.avo.entities.InvoiceStatusEnum.ISSUED), start, end);
        }
        return invoiceRepository.sumBilledMinutesByStatuses(Arrays.asList(com.avo.entities.InvoiceStatusEnum.DRAFT, com.avo.entities.InvoiceStatusEnum.ISSUED));
    }

    public double getPendingAmountHT(java.util.Date startDate, java.util.Date endDate) {
        java.math.BigDecimal sum;
        if (startDate != null && endDate != null) {
            java.time.LocalDate start = startDate.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate();
            java.time.LocalDate end = endDate.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate();
            sum = invoiceRepository.sumBilledAmountHTByStatusesWithDates(Arrays.asList(com.avo.entities.InvoiceStatusEnum.DRAFT, com.avo.entities.InvoiceStatusEnum.ISSUED), start, end);
        } else {
            sum = invoiceRepository.sumBilledAmountHTByStatuses(Arrays.asList(com.avo.entities.InvoiceStatusEnum.DRAFT, com.avo.entities.InvoiceStatusEnum.ISSUED));
        }
        return sum != null ? sum.doubleValue() : 0.0;
    }

    public double getPendingAmountTTC(java.util.Date startDate, java.util.Date endDate) {
        return getPendingAmountHT(startDate, endDate) * 1.20;
    }

    public long getCancelledMinutes(java.util.Date startDate, java.util.Date endDate) {
        if (startDate != null && endDate != null) {
            java.time.LocalDate start = startDate.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate();
            java.time.LocalDate end = endDate.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate();
            return invoiceRepository.sumBilledMinutesByStatusesWithDates(Arrays.asList(com.avo.entities.InvoiceStatusEnum.CANCELLED, com.avo.entities.InvoiceStatusEnum.WRITTEN_OFF), start, end);
        }
        return invoiceRepository.sumBilledMinutesByStatuses(Arrays.asList(com.avo.entities.InvoiceStatusEnum.CANCELLED, com.avo.entities.InvoiceStatusEnum.WRITTEN_OFF));
    }

    public double getCancelledAmountHT(java.util.Date startDate, java.util.Date endDate) {
        java.math.BigDecimal sum;
        if (startDate != null && endDate != null) {
            java.time.LocalDate start = startDate.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate();
            java.time.LocalDate end = endDate.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate();
            sum = invoiceRepository.sumBilledAmountHTByStatusesWithDates(Arrays.asList(com.avo.entities.InvoiceStatusEnum.CANCELLED, com.avo.entities.InvoiceStatusEnum.WRITTEN_OFF), start, end);
        } else {
            sum = invoiceRepository.sumBilledAmountHTByStatuses(Arrays.asList(com.avo.entities.InvoiceStatusEnum.CANCELLED, com.avo.entities.InvoiceStatusEnum.WRITTEN_OFF));
        }
        return sum != null ? sum.doubleValue() : 0.0;
    }

    public double getCancelledAmountTTC(java.util.Date startDate, java.util.Date endDate) {
        return getCancelledAmountHT(startDate, endDate) * 1.20;
    }

    public double getUnbilledAmountTTC(java.util.Date startDate, java.util.Date endDate) {
        double ht = getUnbilledAmountHT(startDate, endDate);
        // Assuming a standard 20% TVA rate for the dashboard estimate
        return ht * 1.20;
    }

    public List<UnbilledDossierSummaryDTO> getUnbilledDossiersSummary(java.util.Date startDate, java.util.Date endDate) {
        List<UnbilledDossierProjection> projections;
        if (startDate != null && endDate != null) {
            projections = invoiceDossierServiceRepository.getUnbilledDossiersSummaryWithDates(Arrays.asList(InvoiceDossierServiceStatusEnum.A_FACTURE), startDate, endDate);
        } else {
            projections = invoiceDossierServiceRepository.getUnbilledDossiersSummary(Arrays.asList(InvoiceDossierServiceStatusEnum.A_FACTURE));
        }
        
        return projections.stream().map(p -> {
            String clientName = "Inconnu";
            if (p.getClientId() != null) {
                ClientEntity client = clientRepository.findById(p.getClientId()).orElse(null);
                if (client != null) {
                    if (client instanceof ClientPersonnePhysique) {
                        clientName = ((ClientPersonnePhysique) client).getNom() + " " + ((ClientPersonnePhysique) client).getPrenom();
                    } else if (client instanceof ClientMoral) {
                        clientName = ((ClientMoral) client).getNomCommercial();
                    } else if (client instanceof Association) {
                        clientName = ((Association) client).getNom();
                    } else if (client instanceof Institution) {
                        clientName = ((Institution) client).getNom();
                    }
                }
            }
            return new UnbilledDossierSummaryDTO(
                p.getDossierId(),
                p.getDossierTitre(),
                p.getReferenceInterne(),
                p.getClientId(),
                clientName,
                p.getUnbilledMinutes() != null ? p.getUnbilledMinutes() : 0,
                p.getUnbilledAmountHT() != null ? p.getUnbilledAmountHT() : 0.0
            );
        }).collect(Collectors.toList());
    }
}
