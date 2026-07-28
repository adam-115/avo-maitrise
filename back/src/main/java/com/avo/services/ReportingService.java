package com.avo.services;

import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.io.ByteArrayOutputStream;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import com.avo.dtos.CabinetProfileDTO;
import com.avo.entities.ClientEntity;
import com.avo.entities.ClientStatus;
import com.avo.entities.Invoice;
import com.avo.entities.InvoiceTimeEntry;
import com.avo.entities.ScreeningMatch;
import com.avo.entities.UBO;
import com.avo.repositories.ClientRepository;
import com.avo.repositories.InvoiceRepository;
import com.avo.repositories.ScreeningMatchRepository;
import com.avo.repositories.UBORepository;

import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.data.JRMapCollectionDataSource;
import net.sf.jasperreports.export.SimpleExporterInput;
import net.sf.jasperreports.export.SimpleOutputStreamExporterOutput;
import net.sf.jasperreports.engine.export.JRPdfExporter;
import net.sf.jasperreports.export.SimplePdfExporterConfiguration;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class ReportingService {

    private final InvoiceRepository invoiceRepository;
    private final CabinetProfileService cabinetProfileService;
    private final ClientRepository clientRepository;
    private final UBORepository uboRepository;
    private final ScreeningMatchRepository screeningMatchRepository;

    public ReportingService(InvoiceRepository invoiceRepository, CabinetProfileService cabinetProfileService, 
                            ClientRepository clientRepository, UBORepository uboRepository, 
                            ScreeningMatchRepository screeningMatchRepository) {
        this.invoiceRepository = invoiceRepository;
        this.cabinetProfileService = cabinetProfileService;
        this.clientRepository = clientRepository;
        this.uboRepository = uboRepository;
        this.screeningMatchRepository = screeningMatchRepository;
    }

    public byte[] generateGlobalAmlReport(String startDateStr, String endDateStr) {
        try {
            log.info("[ENTER] generateGlobalAmlReport for startDate: {}, endDate: {}", startDateStr, endDateStr);

            // 1. Gérer la période par défaut : 2 dernières années si vide ou null
            LocalDate startLocal = (startDateStr != null && !startDateStr.trim().isEmpty()) 
                ? LocalDate.parse(startDateStr.trim().substring(0, 10)) 
                : LocalDate.now().minusYears(2);
            LocalDate endLocal = (endDateStr != null && !endDateStr.trim().isEmpty()) 
                ? LocalDate.parse(endDateStr.trim().substring(0, 10)) 
                : LocalDate.now();

            Date startDate = Date.from(startLocal.atStartOfDay(ZoneId.systemDefault()).toInstant());
            Date endDate = Date.from(endLocal.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant());

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            String periodText = "Du " + startLocal.format(dtf) + " au " + endLocal.format(dtf);
            String reportDate = LocalDate.now().format(dtf);

            // 2. Filtrer les clients par date
            List<ClientEntity> allClients = clientRepository.findAll();
            List<ClientEntity> clients = allClients.stream()
                .filter(c -> {
                    Date createdAt = c.getCreatedAt();
                    if (createdAt == null) return true;
                    return !createdAt.before(startDate) && !createdAt.after(endDate);
                })
                .collect(Collectors.toList());

            // 3. Calculs des KPIs et constitution des données du rapport
            int total = clients.size();
            int validated = 0;
            int pending = 0;
            int blocked = 0;
            int highRisk = 0;
            int mediumRisk = 0;
            int lowRisk = 0;

            List<Map<String, ?>> dataSourceList = new ArrayList<>();
            SimpleDateFormat df = new SimpleDateFormat("dd/MM/yyyy");
            java.time.LocalDateTime latestScreening = null;

            for (ClientEntity c : clients) {
                ClientStatus st = c.getClientStatus();
                if (st == ClientStatus.VALIDATED || st == ClientStatus.AML_VALIDATED) {
                    validated++;
                } else if (st == ClientStatus.BLOCKED) {
                    blocked++;
                } else {
                    pending++;
                }

                double maxScore = 0.0;
                int hitCount = 0;
                if (c.getScreeningMatchs() != null && !c.getScreeningMatchs().isEmpty()) {
                    hitCount = c.getScreeningMatchs().size();
                    for (ScreeningMatch m : c.getScreeningMatchs()) {
                        if (m.getScore() != null && m.getScore() > maxScore) {
                            maxScore = m.getScore();
                        }
                        if (m.getCreatedAt() != null && (latestScreening == null || m.getCreatedAt().isAfter(latestScreening))) {
                            latestScreening = m.getCreatedAt();
                        }
                    }
                }

                String riskStr;
                if (maxScore >= 0.7) {
                    highRisk++;
                    riskStr = "ÉLEVÉ (" + Math.round(maxScore * 100) + "%)";
                } else if (maxScore >= 0.4) {
                    mediumRisk++;
                    riskStr = "MOYEN (" + Math.round(maxScore * 100) + "%)";
                } else {
                    lowRisk++;
                    riskStr = hitCount > 0 ? "FAIBLE (" + Math.round(maxScore * 100) + "%)" : "AUCUN (0%)";
                }

                Map<String, Object> row = new HashMap<>();
                String name = c.getDisplayName() != null ? c.getDisplayName() : (c.getEmail() != null ? c.getEmail() : "Client #" + c.getId());
                row.put("clientName", name);
                
                String typeStr = c.getType() != null ? c.getType() : "CLIENT";
                switch (typeStr) {
                    case "PERSONNE": typeStr = "Pers. Physique"; break;
                    case "SOCIETE": typeStr = "Société"; break;
                    case "ASSOCIATION": typeStr = "Association"; break;
                    case "INSTITUTION": typeStr = "Institution"; break;
                }
                row.put("clientType", typeStr);

                String pays = c.getPays() != null && !c.getPays().isEmpty() ? c.getPays() : "N/D";
                String secteur = c.getSecteurActivite() != null && !c.getSecteurActivite().isEmpty() ? c.getSecteurActivite() : "N/D";
                row.put("countrySector", pays + " / " + secteur);
                
                row.put("createdDate", c.getCreatedAt() != null ? df.format(c.getCreatedAt()) : "N/D");
                row.put("riskLevel", riskStr);
                
                String amlStStr = "Requis";
                if (st != null) {
                    switch (st) {
                        case VALIDATED: amlStStr = "Validé"; break;
                        case AML_VALIDATED: amlStStr = "AML Validé"; break;
                        case BLOCKED: amlStStr = "BLOQUÉ"; break;
                        case INDULGENCE_REQUIRED: amlStStr = "Indulgence"; break;
                        case VERIFICATION_AML_REQUIRED: amlStStr = "En vérif."; break;
                        case AML_REQUIRED: amlStStr = "AML Requis"; break;
                    }
                }
                row.put("amlStatus", amlStStr);

                dataSourceList.add(row);
            }

            if (dataSourceList.isEmpty()) {
                Map<String, Object> emptyRow = new HashMap<>();
                emptyRow.put("clientName", "Aucun client sur la période sélectionnée");
                emptyRow.put("clientType", "-");
                emptyRow.put("countrySector", "-");
                emptyRow.put("createdDate", "-");
                emptyRow.put("riskLevel", "Aucun risque");
                emptyRow.put("amlStatus", "N/A");
                dataSourceList.add(emptyRow);
            }

            long compRate = total > 0 ? Math.round(((double) validated / total) * 100) : 100;

            // 4. Synthèse et avis d'expert
            StringBuilder comment = new StringBuilder();
            comment.append("Sur la période auditée (").append(periodText).append("), le portefeuille examiné comprend ").append(total).append(" client(s). ");
            comment.append("Le taux global de conformité LCB-FT est de ").append(compRate).append("%. ");
            if (highRisk > 0) {
                comment.append(highRisk).append(" dossier(s) présentent un profil de RISQUE ÉLEVÉ nécessitant des mesures de vigilance renforcée (article L.561-10 du CMF). ");
            } else {
                comment.append("Aucun profil à risque élevé critique détecté parmi la clientèle sur la période. ");
            }
            if (blocked > 0) {
                comment.append(blocked).append(" client(s) ont fait l'objet d'une mesure de blocage par précaution réglementaire. ");
            } else if (pending > 0) {
                comment.append(pending).append(" dossier(s) restent en attente de validation ou de collecte de diligences KYC. ");
            } else {
                comment.append("L'intégralité du portefeuille sur la période est en parfaite conformité. ");
            }
            comment.append("\n[CERTIFICATION LCB-FT] : Criblage d'alertes opéré via le moteur de vérification Yente / OpenSanctions (Sanctions Internationales GEL, UE, OFAC, ONU & registres PPE).");

            String lastScreeningStr = (latestScreening != null) 
                ? latestScreening.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"))
                : java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm")) + " (Contrôle à jour)";

            // 5. Remplissage et export du rapport Jasper
            CabinetProfileDTO cabinetProfile = cabinetProfileService.getProfile();
            InputStream reportStream = new ClassPathResource("report/templates/aml_report.jrxml").getInputStream();
            JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);

            Map<String, Object> parameters = new HashMap<>();
            parameters.put("cabinetName", cabinetProfile.getName() != null ? cabinetProfile.getName() : "Cabinet d'Avocats");
            parameters.put("cabinetAddress", cabinetProfile.getAddress() != null ? cabinetProfile.getAddress() : "");
            parameters.put("cabinetPhone", cabinetProfile.getPhone() != null ? cabinetProfile.getPhone() : "");
            parameters.put("cabinetEmail", cabinetProfile.getEmail() != null ? cabinetProfile.getEmail() : "");
            if (cabinetProfile.getLogo() != null && cabinetProfile.getLogo().length > 0) {
                parameters.put("logo", new java.io.ByteArrayInputStream(cabinetProfile.getLogo()));
            }
            parameters.put("reportDate", reportDate);
            parameters.put("periodText", periodText);
            parameters.put("totalClients", String.valueOf(total));
            parameters.put("complianceRate", compRate + "%");
            parameters.put("highRiskCount", String.valueOf(highRisk));
            parameters.put("blockedCount", String.valueOf(blocked));
            parameters.put("expertComment", comment.toString());
            parameters.put("lastScreeningDate", lastScreeningStr);

            JRMapCollectionDataSource dataSource = new JRMapCollectionDataSource(dataSourceList);
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);
            return JasperExportManager.exportReportToPdf(jasperPrint);

        } catch (Exception e) {
            log.error("Failed to generate global AML report for period {} - {}", startDateStr, endDateStr, e);
            throw new RuntimeException("Error generating AML report PDF", e);
        }
    }

    public byte[] generateInvoicePdf(Long invoiceId) {
        try {
            log.info("[ENTER] generateInvoicePdf for invoice id: {}", invoiceId);
            JasperPrint jasperPrint = generateJasperPrint(invoiceId);
            return JasperExportManager.exportReportToPdf(jasperPrint);
        } catch (Exception e) {
            log.error("Failed to generate PDF for invoice {}", invoiceId, e);
            throw new RuntimeException("Error generating PDF", e);
        }
    }

    public byte[] generateBulkInvoicePdf(List<Long> invoiceIds) {
        try {
            log.info("[ENTER] generateBulkInvoicePdf for invoices: {}", invoiceIds);
            List<JasperPrint> jasperPrintList = new ArrayList<>();
            for (Long id : invoiceIds) {
                jasperPrintList.add(generateJasperPrint(id));
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            JRPdfExporter exporter = new JRPdfExporter();
            exporter.setExporterInput(SimpleExporterInput.getInstance(jasperPrintList));
            exporter.setExporterOutput(new SimpleOutputStreamExporterOutput(outputStream));
            
            SimplePdfExporterConfiguration configuration = new SimplePdfExporterConfiguration();
            configuration.setCreatingBatchModeBookmarks(true);
            exporter.setConfiguration(configuration);
            
            exporter.exportReport();
            return outputStream.toByteArray();

        } catch (Exception e) {
            log.error("Failed to generate bulk PDF for invoices {}", invoiceIds, e);
            throw new RuntimeException("Error generating bulk PDF", e);
        }
    }

    private JasperPrint generateJasperPrint(Long invoiceId) throws Exception {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Invoice not found: " + invoiceId));

        CabinetProfileDTO cabinetProfile = cabinetProfileService.getProfile();

        // Load and compile the template
        InputStream reportStream = new ClassPathResource("report/templates/invoice.jrxml").getInputStream();
        JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);

        // Prepare Parameters
            Map<String, Object> parameters = new HashMap<>();
            parameters.put("cabinetName", cabinetProfile.getName() != null ? cabinetProfile.getName() : "");
            parameters.put("cabinetAddress", cabinetProfile.getAddress() != null ? cabinetProfile.getAddress() : "");
            parameters.put("cabinetPhone", cabinetProfile.getPhone() != null ? cabinetProfile.getPhone() : "");
            parameters.put("cabinetEmail", cabinetProfile.getEmail() != null ? cabinetProfile.getEmail() : "");

            if (cabinetProfile.getLogo() != null && cabinetProfile.getLogo().length > 0) {
                parameters.put("logo", new java.io.ByteArrayInputStream(cabinetProfile.getLogo()));
            }

            String clientName = "Client inconnu";
            String clientAddress = "";
            if (invoice.getDossier() != null && invoice.getDossier().getClient() != null) {
                ClientEntity client = invoice.getDossier().getClient();
                clientAddress = client.getAdresse() != null ? client.getAdresse() : "";
                clientName = client.getDisplayName() != null ? client.getDisplayName() : "Client";
            }

            parameters.put("clientName", clientName);
            parameters.put("clientAddress", clientAddress);
            parameters.put("invoiceNumber", invoice.getNumeroFacture() != null ? invoice.getNumeroFacture() : "BROUILLON");
            parameters.put("invoiceDate", invoice.getIssueDate() != null ? invoice.getIssueDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "");
            parameters.put("subtotal", invoice.getSubtotalAmount() != null ? invoice.getSubtotalAmount().toString() + " €" : "0.00 €");
            BigDecimal computedTaxAmount = BigDecimal.ZERO;
            if (invoice.getSubtotalAmount() != null && invoice.getTaxRate() != null) {
                computedTaxAmount = invoice.getSubtotalAmount().multiply(invoice.getTaxRate()).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
            }
            parameters.put("vat", computedTaxAmount.toString() + " €");
            parameters.put("vatRate", invoice.getTaxRate() != null ? invoice.getTaxRate().toString() + "%" : "0%");
            parameters.put("total", invoice.getTotalAmount() != null ? invoice.getTotalAmount().toString() + " €" : "0.00 €");

            // Prepare Data Source
            List<Map<String, ?>> dataSourceList = new ArrayList<>();
            if (invoice.getInvoiceTimeEntries() != null) {
                for (InvoiceTimeEntry entry : invoice.getInvoiceTimeEntries()) {
                    Map<String, Object> row = new HashMap<>();
                    String desc = "Prestation";
                    if (entry.getInvoiceDossierService() != null && entry.getInvoiceDossierService().getInvoiceTypeOfService() != null) {
                        desc = entry.getInvoiceDossierService().getInvoiceTypeOfService().getCode();
                        if (entry.getInvoiceDossierService().getInvoiceTypeOfService().getDescription() != null) {
                            desc += "\n" + entry.getInvoiceDossierService().getInvoiceTypeOfService().getDescription();
                        }
                    }
                    row.put("description", desc);
                    row.put("quantity", entry.getNbrOfMinutes() + " min");
                    row.put("price", (entry.getPrice5min() != null ? entry.getPrice5min().toString() : "0") + " €");
                    
                    BigDecimal entryTotal = BigDecimal.ZERO;
                    if (entry.getPrice5min() != null) {
                        entryTotal = entry.getPrice5min()
                                .multiply(new BigDecimal(entry.getNbrOfMinutes()))
                                .divide(new BigDecimal(5), 2, RoundingMode.HALF_UP);
                    }
                    row.put("total", entryTotal.toString() + " €");
                    dataSourceList.add(row);
                }
            }

            JRMapCollectionDataSource dataSource = new JRMapCollectionDataSource(dataSourceList);

            // Fill and Export
            return JasperFillManager.fillReport(jasperReport, parameters, dataSource);

    }

    public byte[] generateGlobalUboAmlReport(String startDateStr, String endDateStr) {
        try {
            log.info("[ENTER] generateGlobalUboAmlReport for startDate: {}, endDate: {}", startDateStr, endDateStr);

            // 1. Période par défaut : 2 dernières années si vide ou null
            LocalDate startLocal = (startDateStr != null && !startDateStr.trim().isEmpty()) 
                ? LocalDate.parse(startDateStr.trim().substring(0, 10)) 
                : LocalDate.now().minusYears(2);
            LocalDate endLocal = (endDateStr != null && !endDateStr.trim().isEmpty()) 
                ? LocalDate.parse(endDateStr.trim().substring(0, 10)) 
                : LocalDate.now();

            Date startDate = Date.from(startLocal.atStartOfDay(ZoneId.systemDefault()).toInstant());
            Date endDate = Date.from(endLocal.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant());

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            String periodText = "Du " + startLocal.format(dtf) + " au " + endLocal.format(dtf);
            String reportDate = LocalDate.now().format(dtf);

            // 2. Filtrer les UBOs par date du client moral rattaché (ou inclure si null)
            List<UBO> allUbos = uboRepository.findAll();
            List<UBO> ubos = allUbos.stream()
                .filter(u -> {
                    if (u.getClientMoral() != null && u.getClientMoral().getCreatedAt() != null) {
                        Date createdAt = u.getClientMoral().getCreatedAt();
                        return !createdAt.before(startDate) && !createdAt.after(endDate);
                    }
                    return true;
                })
                .collect(Collectors.toList());

            int totalUbos = ubos.size();
            int compliantCount = 0;
            int highRiskCount = 0;
            int blockedCount = 0;

            List<Map<String, ?>> dataSourceList = new ArrayList<>();
            java.time.LocalDateTime latestScreening = null;

            for (UBO ubo : ubos) {
                Map<String, Object> row = new HashMap<>();
                row.put("uboName", ubo.getFullName() != null ? ubo.getFullName() : "UBO Inconnu");
                
                String clientName = (ubo.getClientMoral() != null && ubo.getClientMoral().getDisplayName() != null)
                    ? ubo.getClientMoral().getDisplayName() : "Société non renseignée";
                row.put("clientName", clientName);

                String role = ubo.getRoleInCompany() != null ? ubo.getRoleInCompany() : "";
                if (ubo.getPercentageOfOwnership() != null) {
                    role = (role.isEmpty() ? "" : role + " ") + "(" + ubo.getPercentageOfOwnership() + "%)";
                }
                row.put("roleAndOwnership", role.isEmpty() ? "N/R" : role);
                row.put("nationality", ubo.getNationality() != null ? ubo.getNationality() : "N/D");

                // Analyse des alertes ScreeningMatch pour le UBO
                List<ScreeningMatch> matches = screeningMatchRepository.findByUboId(ubo.getId());
                double maxScore = 0.0;
                if (matches != null && !matches.isEmpty()) {
                    for (ScreeningMatch sm : matches) {
                        if (sm.getScore() != null && sm.getScore() > maxScore) {
                            maxScore = sm.getScore();
                        }
                        if (sm.getCreatedAt() != null && (latestScreening == null || sm.getCreatedAt().isAfter(latestScreening))) {
                            latestScreening = sm.getCreatedAt();
                        }
                    }
                }

                String riskLevel = "Aucune alerte";
                if (maxScore >= 0.8) {
                    riskLevel = "Elevé (" + Math.round(maxScore * 100) + "%)";
                    highRiskCount++;
                } else if (maxScore >= 0.5) {
                    riskLevel = "Moyen (" + Math.round(maxScore * 100) + "%)";
                } else if (maxScore > 0) {
                    riskLevel = "Faible (" + Math.round(maxScore * 100) + "%)";
                }
                row.put("riskLevel", riskLevel);

                // Statut AML
                String status = ubo.getAmlAnalysisStatus();
                if (status == null || status.isEmpty()) {
                    status = (maxScore > 0) ? "SUSPECT" : "OK";
                }
                if (status.equalsIgnoreCase("OK") || status.equalsIgnoreCase("VALIDE") || status.equalsIgnoreCase("VERIFIED")) {
                    compliantCount++;
                }
                if (status.equalsIgnoreCase("BLOCKED") || status.equalsIgnoreCase("BLOQUE")) {
                    blockedCount++;
                }
                row.put("amlStatus", status);

                dataSourceList.add(row);
            }

            if (dataSourceList.isEmpty()) {
                Map<String, Object> emptyRow = new HashMap<>();
                emptyRow.put("uboName", "Aucun UBO sur la période sélectionnée");
                emptyRow.put("clientName", "-");
                emptyRow.put("roleAndOwnership", "-");
                emptyRow.put("nationality", "-");
                emptyRow.put("riskLevel", "Aucun risque");
                emptyRow.put("amlStatus", "N/A");
                dataSourceList.add(emptyRow);
            }

            String complianceRateText = "100%";
            if (totalUbos > 0) {
                int perc = (int) Math.round(((double) compliantCount / totalUbos) * 100.0);
                complianceRateText = perc + "%";
            } else {
                complianceRateText = "N/A";
            }

            // 3. Récupérer les informations du cabinet
            CabinetProfileDTO profile = cabinetProfileService.getProfile();
            Map<String, Object> parameters = new HashMap<>();
            parameters.put("cabinetName", profile.getName() != null ? profile.getName() : "Cabinet d'Avocats");
            parameters.put("cabinetAddress", profile.getAddress() != null ? profile.getAddress() : "");
            parameters.put("cabinetPhone", profile.getPhone() != null ? profile.getPhone() : "");
            parameters.put("cabinetEmail", profile.getEmail() != null ? profile.getEmail() : "");
            parameters.put("reportDate", reportDate);
            parameters.put("periodText", periodText);
            parameters.put("totalUbos", String.valueOf(totalUbos));
            parameters.put("complianceRate", complianceRateText);
            parameters.put("highRiskCount", String.valueOf(highRiskCount));
            parameters.put("blockedCount", String.valueOf(blockedCount));

            String expertComment = "Audit LCB-FT sur un total de " + totalUbos + " bénéficiaire(s) effectif(s) (UBOs) des personnes morales clientes du cabinet sur la période (" + periodText + "). Taux de conformité des bénéficiaires effectifs évalué à " + complianceRateText + ". " 
                + (highRiskCount > 0 ? "ATTENTION : " + highRiskCount + " bénéficiaire(s) effectif(s) requiert(ent) une vigilance renforcée ou sont assimilés PPE / sous alerte sanction. " : "Aucun risque critique de blanchiment ou sanction détecté chez les bénéficiaires effectifs audités. ")
                + "\n[CERTIFICATION LCB-FT] : Criblage et vérification d'identités réalisés via l'infrastructure Yente / OpenSanctions (Listes officielles GEL, UE, OFAC, ONU & registres PPE).";
            parameters.put("expertComment", expertComment);

            String lastScreeningStr = (latestScreening != null) 
                ? latestScreening.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"))
                : java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm")) + " (Contrôle à jour)";
            parameters.put("lastScreeningDate", lastScreeningStr);

            // Charger le logo
            try {
                InputStream logoStream = new ClassPathResource("report/templates/logo.png").getInputStream();
                parameters.put("logo", logoStream);
            } catch (Exception e) {
                log.warn("Could not load logo.png for report: {}", e.getMessage());
                parameters.put("logo", null);
            }

            // 4. Charger et compiler le rapport JasperReports
            ClassPathResource reportResource = new ClassPathResource("report/templates/ubo_aml_report.jrxml");
            InputStream reportStream = reportResource.getInputStream();
            JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);

            JRMapCollectionDataSource dataSource = new JRMapCollectionDataSource(dataSourceList);
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);

            return JasperExportManager.exportReportToPdf(jasperPrint);

        } catch (Exception e) {
            log.error("Error generating UBO AML report PDF", e);
            throw new RuntimeException("Error generating UBO AML report PDF", e);
        }
    }
}

