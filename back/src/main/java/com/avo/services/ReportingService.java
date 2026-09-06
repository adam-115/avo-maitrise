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
import com.fasterxml.jackson.databind.JsonNode;

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
@lombok.RequiredArgsConstructor
public class ReportingService {

    private final InvoiceRepository invoiceRepository;
    private final CabinetProfileService cabinetProfileService;
    private final ClientRepository clientRepository;
    private final UBORepository uboRepository;
    private final ScreeningMatchRepository screeningMatchRepository;
    private final com.avo.repositories.DiligenceFormResultRepository diligenceFormResultRepository;

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

    public byte[] generateClientKycAuditReport(Long clientId) {
        try {
            log.info("[ENTER] generateClientKycAuditReport for client id: {}", clientId);
            ClientEntity c = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found with id: " + clientId));

            SimpleDateFormat df = new SimpleDateFormat("dd/MM/yyyy");
            String reportDate = df.format(new Date());

            // 1. Client identification and screening score
            int hitCount = 0;
            double maxScore = 0.0;
            java.time.LocalDateTime latestScreening = null;
            if (c.getScreeningMatchs() != null) {
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
                riskStr = "ÉLEVÉ (" + Math.round(maxScore * 100) + "%)";
            } else if (maxScore >= 0.4) {
                riskStr = "MOYEN (" + Math.round(maxScore * 100) + "%)";
            } else {
                riskStr = hitCount > 0 ? "FAIBLE (" + Math.round(maxScore * 100) + "%)" : "0% (Aucune alerte)";
            }

            String typeStr = c.getType() != null ? c.getType() : "CLIENT";
            switch (typeStr) {
                case "PERSONNE": typeStr = "Personne Physique"; break;
                case "SOCIETE": typeStr = "Société Commerciale / Personne Morale"; break;
                case "ASSOCIATION": typeStr = "Association / Structure Non-Lucrative"; break;
                case "INSTITUTION": typeStr = "Institution / Collectivité"; break;
            }

            // 2. Fetch UBOs of this client (if applicable)
            List<UBO> ubos = uboRepository.findByClientMoralId(c.getId());
            List<Map<String, ?>> dataSourceList = new ArrayList<>();
            
            int uboHighRisk = 0;
            if (ubos != null && !ubos.isEmpty()) {
                for (UBO u : ubos) {
                    Map<String, Object> row = new HashMap<>();
                    row.put("uboName", u.getFullName() != null ? u.getFullName() : "UBO Inconnu");
                    
                    String role = u.getRoleInCompany() != null ? u.getRoleInCompany() : "";
                    if (u.getPercentageOfOwnership() != null) {
                        role = (role.isEmpty() ? "" : role + " - ") + u.getPercentageOfOwnership() + "%";
                    }
                    row.put("roleAndOwnership", role.isEmpty() ? "N/R" : role);
                    row.put("nationality", u.getNationality() != null ? u.getNationality() : "N/D");

                    List<ScreeningMatch> uboMatches = screeningMatchRepository.findByUboId(u.getId());
                    double uboMaxScore = 0.0;
                    if (uboMatches != null) {
                        for (ScreeningMatch sm : uboMatches) {
                            if (sm.getScore() != null && sm.getScore() > uboMaxScore) {
                                uboMaxScore = sm.getScore();
                            }
                            if (sm.getCreatedAt() != null && (latestScreening == null || sm.getCreatedAt().isAfter(latestScreening))) {
                                latestScreening = sm.getCreatedAt();
                            }
                        }
                    }

                    String uboRisk = "Aucune alerte";
                    if (uboMaxScore >= 0.8) {
                        uboRisk = "Elevé (" + Math.round(uboMaxScore * 100) + "%)";
                        uboHighRisk++;
                    } else if (uboMaxScore >= 0.5) {
                        uboRisk = "Moyen (" + Math.round(uboMaxScore * 100) + "%)";
                    } else if (uboMaxScore > 0) {
                        uboRisk = "Faible (" + Math.round(uboMaxScore * 100) + "%)";
                    }
                    row.put("riskLevel", uboRisk);

                    String status = u.getAmlAnalysisStatus() != null ? u.getAmlAnalysisStatus() : ((uboMaxScore > 0) ? "SUSPECT" : "OK");
                    row.put("amlStatus", status);
                    
                    dataSourceList.add(row);
                }
            }

            if (dataSourceList.isEmpty()) {
                Map<String, Object> emptyRow = new HashMap<>();
                if ("PERSONNE".equalsIgnoreCase(c.getType())) {
                    emptyRow.put("uboName", "Client Personne Physique (Pas d'UBO applicable)");
                } else {
                    emptyRow.put("uboName", "Aucun bénéficiaire effectif déclaré au dossier");
                }
                emptyRow.put("roleAndOwnership", "-");
                emptyRow.put("nationality", "-");
                emptyRow.put("riskLevel", "-");
                emptyRow.put("amlStatus", "N/A");
                dataSourceList.add(emptyRow);
            }

            String lastScreeningStr = (latestScreening != null) 
                ? latestScreening.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"))
                : java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm")) + " (Contrôle à jour)";

            // 3. Expert conclusion
            StringBuilder comment = new StringBuilder();
            comment.append("Fiche d'évaluation individuelle établie conformément aux obligations de vigilance (Art. L.561-4 et L.561-5 du CMF). ");
            comment.append("Le client présente actuellement un niveau de risque évalué comme : ").append(riskStr).append(". ");
            if (maxScore >= 0.7 || uboHighRisk > 0) {
                comment.append("ATTENTION : Au vu du profil ou des alertes sanction/PPE relevées sur le client ou ses bénéficiaires effectifs, l'application de mesures de VIGILANCE RENFORCÉE est impérative (Article L.561-10 CMF). ");
            } else {
                comment.append("Aucun élément d'alerte critique sur listes de sanctions ou de PPE n'est actif au dossier. Le niveau de vigilance standard / normale est préconisé pour l'entrée en relation ou la continuation de mission. ");
            }
            comment.append("\n[CERTIFICATION LCB-FT] : Contrôle de conformité et criblage automatisé opéré sur les registres officiels de sanctions internationales (DG Trésor, Union Européenne, OFAC, ONU, SECO) et répertoires de PPE.");

            // Diligence Form Details
            List<com.avo.entities.DiligenceFormResult> forms = diligenceFormResultRepository.findByClientId(clientId);
            String formDetails = "";
            if (forms != null && !forms.isEmpty()) {
                StringBuilder sb = new StringBuilder();
                sb.append("<br><br><font color='#0E7490'><b>--- DONNÉES DES FORMULAIRES DE DILIGENCE ---</b></font><br><br>");
                for (com.avo.entities.DiligenceFormResult form : forms) {
                    if (form.getFieldResults() != null && form.getFormConfig() != null) {
                        sb.append("<b>Formulaire :</b> ").append(form.getFormConfig().getTitle()).append("<br>");
                        if (form.getUbo() != null) {
                            sb.append("<b>Ciblé pour le bénéficiaire effectif :</b> ").append(form.getUbo().getFullName()).append("<br>");
                        }
                        sb.append("<br>");
                        for (com.avo.entities.FieldResult fr : form.getFieldResults()) {
                            String label = fr.getFieldConfigId();
                            boolean isFile = false;
                            if (form.getFormConfig().getFields() != null) {
                                for (com.avo.entities.FieldConfig fc : form.getFormConfig().getFields()) {
                                    if (fc.getId().equals(fr.getFieldConfigId())) {
                                        label = fc.getLabel();
                                        if ("file".equalsIgnoreCase(fc.getType())) {
                                            isFile = true;
                                        }
                                        break;
                                    }
                                }
                            }
                            
                            // On exclut les fichiers et les longues chaines base64
                            if (!isFile && fr.getValue() != null && !fr.getValue().startsWith("data:")) {
                                sb.append("&#8226; <i>").append(label).append("</i> : ").append(fr.getValue()).append("<br>");
                            }
                        }
                        sb.append("<br><hr><br>");
                    }
                }
                formDetails = sb.toString();
            }
            
            // Add Screening Matches to the form details (if any)
            StringBuilder sf = new StringBuilder(formDetails);
            if (c.getScreeningMatchs() != null && !c.getScreeningMatchs().isEmpty()) {
                sf.append(formatScreeningMatchesHtml(c.getScreeningMatchs()));
            }
            formDetails = sf.toString();

            // 4. Cabinet Info & Parameters
            CabinetProfileDTO cabinetProfile = cabinetProfileService.getProfile();
            Map<String, Object> parameters = new HashMap<>();
            parameters.put("diligenceFormDetails", formDetails);
            parameters.put("cabinetName", cabinetProfile.getName() != null ? cabinetProfile.getName() : "Cabinet d'Avocats");
            parameters.put("cabinetAddress", cabinetProfile.getAddress() != null ? cabinetProfile.getAddress() : "");
            parameters.put("cabinetPhone", cabinetProfile.getPhone() != null ? cabinetProfile.getPhone() : "");
            parameters.put("cabinetEmail", cabinetProfile.getEmail() != null ? cabinetProfile.getEmail() : "");
            
            parameters.put("reportDate", reportDate);
            parameters.put("clientName", c.getDisplayName() != null ? c.getDisplayName() : (c.getEmail() != null ? c.getEmail() : "Client #" + c.getId()));
            parameters.put("clientType", typeStr);
            parameters.put("clientEmail", c.getEmail() != null ? c.getEmail() : "");
            parameters.put("clientPhone", c.getTelephone() != null ? c.getTelephone() : "");
            parameters.put("clientAddress", c.getAdresse() != null ? c.getAdresse() : "");
            parameters.put("clientCountry", c.getPays() != null ? c.getPays() : "N/D");
            parameters.put("clientSector", c.getSecteurActivite() != null ? c.getSecteurActivite() : "N/D");
            parameters.put("clientCreationDate", c.getCreatedAt() != null ? df.format(c.getCreatedAt()) : "N/D");
            
            String stDisplay = "EN ATTENTE";
            if (c.getClientStatus() != null) {
                switch (c.getClientStatus()) {
                    case VALIDATED: stDisplay = "VALIDÉ"; break;
                    case AML_VALIDATED: stDisplay = "CONFORME LCB-FT"; break;
                    case BLOCKED: stDisplay = "BLOQUÉ (ALERTES)"; break;
                    case INDULGENCE_REQUIRED: stDisplay = "INDULGENCE REQUISE"; break;
                    case AML_REQUIRED: stDisplay = "CRIBLAGE REQUIS"; break;
                    case VERIFICATION_AML_REQUIRED: stDisplay = "VÉRIf. EN COURS"; break;
                    default: stDisplay = c.getClientStatus().toString(); break;
                }
            }
            parameters.put("clientStatus", stDisplay);
            parameters.put("riskLevel", riskStr);
            parameters.put("matchesCount", hitCount + " alerte(s)");
            parameters.put("lastScreeningDate", lastScreeningStr);
            parameters.put("expertComment", comment.toString());

            try {
                InputStream logoStream = new ClassPathResource("report/templates/logo.png").getInputStream();
                parameters.put("logo", logoStream);
            } catch (Exception e) {
                log.warn("Could not load logo.png for report: {}", e.getMessage());
                parameters.put("logo", null);
            }

            InputStream reportStream = new ClassPathResource("report/templates/client_kyc_audit.jrxml").getInputStream();
            JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);

            JRMapCollectionDataSource dataSource = new JRMapCollectionDataSource(dataSourceList);
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);

            return JasperExportManager.exportReportToPdf(jasperPrint);

        } catch (Exception e) {
            log.error("Failed to generate client KYC audit report for clientId: {}", clientId, e);
            throw new RuntimeException("Error generating client KYC audit report PDF", e);
        }
    }

    public byte[] generateDiligenceFormResultReport(String resultId) {
        try {
            log.info("[ENTER] generateDiligenceFormResultReport for resultId: {}", resultId);
            com.avo.entities.DiligenceFormResult form = diligenceFormResultRepository.findById(resultId)
                .orElseThrow(() -> new RuntimeException("Form Result not found: " + resultId));

            CabinetProfileDTO cabinetProfile = cabinetProfileService.getProfile();
            Map<String, Object> parameters = new HashMap<>();
            
            parameters.put("cabinetName", cabinetProfile.getName() != null ? cabinetProfile.getName() : "");
            parameters.put("cabinetAddress", cabinetProfile.getAddress() != null ? cabinetProfile.getAddress() : "");
            parameters.put("cabinetPhone", cabinetProfile.getPhone() != null ? cabinetProfile.getPhone() : "");
            parameters.put("cabinetEmail", cabinetProfile.getEmail() != null ? cabinetProfile.getEmail() : "");
            
            try {
                InputStream logoStream = new ClassPathResource("report/templates/logo.png").getInputStream();
                parameters.put("logo", logoStream);
            } catch (Exception e) {
                log.warn("Could not load logo.png for report: {}", e.getMessage());
                parameters.put("logo", null);
            }
            
            java.time.format.DateTimeFormatter df = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            parameters.put("submitDate", form.getCreationDate() != null ? form.getCreationDate().format(df) : "");
            
            if (form.getFormConfig() != null) {
                parameters.put("formTitle", form.getFormConfig().getTitle());
                parameters.put("formDescription", form.getFormConfig().getDescription());
            } else {
                parameters.put("formTitle", "Résultat de formulaire");
            }
            
            if (form.getClient() != null) {
                ClientEntity c = form.getClient();
                if (c != null) {
                    parameters.put("clientName", c.getDisplayName() != null ? c.getDisplayName() : c.getEmail());
                    parameters.put("clientEmail", c.getEmail() != null ? c.getEmail() : "");
                    parameters.put("clientPhone", c.getTelephone() != null ? c.getTelephone() : "");
                }
            }
            
            StringBuilder sb = new StringBuilder();
            sb.append("<font color='#0F172A' size='5'><b>Données du Formulaire</b></font><br>");
            sb.append("<font color='#E2E8F0'>____________________________________________________________________</font><br><br>");
            
            if (form.getFieldResults() != null && form.getFormConfig() != null) {
                for (com.avo.entities.FieldResult fr : form.getFieldResults()) {
                    String label = fr.getFieldConfigId();
                    boolean isFile = false;
                    for (com.avo.entities.FieldConfig fc : form.getFormConfig().getFields()) {
                        if (fc.getId().equals(fr.getFieldConfigId())) {
                            label = fc.getLabel();
                            if ("file".equalsIgnoreCase(fc.getType())) {
                                isFile = true;
                            }
                            break;
                        }
                    }
                    if (!isFile && fr.getValue() != null && !fr.getValue().startsWith("data:")) {
                        sb.append("<font color='#64748B' size='3'>").append(label).append("</font><br>");
                        sb.append("<font color='#0F172A' size='3'><b>").append(fr.getValue()).append("</b></font><br><br>");
                    }
                }
            }
            
            // Ajout des résultats du Screening AML (ScreeningMatch)
            if (form.getClient() != null && form.getClient().getId() != null) {
                java.util.List<com.avo.entities.ScreeningMatch> matches = screeningMatchRepository.findByClientId(form.getClient().getId());
                if (matches != null && !matches.isEmpty()) {
                    sb.append(formatScreeningMatchesHtml(matches));
                }
            }
            parameters.put("diligenceFormDetails", sb.toString());

            InputStream reportStream = new ClassPathResource("report/templates/diligence_form_result.jrxml").getInputStream();
            JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);

            // Pass an empty data source with 1 empty record so the summary band renders
            java.util.List<Map<String, ?>> emptyList = new ArrayList<>();
            emptyList.add(new HashMap<>());
            JRMapCollectionDataSource dataSource = new JRMapCollectionDataSource(emptyList);
            
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);

            return JasperExportManager.exportReportToPdf(jasperPrint);

        } catch (Exception e) {
            log.error("Error generating Form Result PDF", e);
            throw new RuntimeException("Error generating Form Result PDF", e);
        }
    }

    public static class DatasetMeta {
        public final String name;
        public final String authority;
        public final String description;

        public DatasetMeta(String name, String authority, String description) {
            this.name = name;
            this.authority = authority;
            this.description = description;
        }
    }

    private static DatasetMeta resolveDatasetMeta(String datasetId, String yenteId) {
        String code = (datasetId != null ? datasetId : "").toLowerCase();
        String yId = (yenteId != null ? yenteId : "").toLowerCase();

        if (code.contains("fr_tresor") || code.contains("tresor") || code.contains("gel") || yId.startsWith("fr-") || code.contains("france")) {
            return new DatasetMeta(
                "DG Trésor 🇫🇷 (France)",
                "Ministère de l'Économie, des Finances et de la Souveraineté Industrielle et Numérique",
                "Registre national officiel des personnes et entités faisant l'objet d'une mesure de gel des avoirs (Art. L.562-2 CMF)."
            );
        }
        if (code.contains("eu_fsf") || code.contains("eu_") || code.contains("european") || code.contains("fsd") || yId.startsWith("eu-")) {
            return new DatasetMeta(
                "Union Européenne 🇪🇺 (UE FSF)",
                "Commission Européenne & Service Européen pour l'Action Extérieure (SEAE)",
                "Liste consolidée des personnes, groupes et entités soumis aux sanctions financières de l'Union Européenne (Règlements PESC)."
            );
        }
        if (code.contains("ofac") || code.contains("sdn") || code.contains("us_") || yId.startsWith("ofac-")) {
            return new DatasetMeta(
                "OFAC SDN 🇺🇸 (États-Unis)",
                "U.S. Department of the Treasury (Office of Foreign Assets Control)",
                "Registre fédéral des personnes et entités sous sanctions économiques et financières (Specially Designated Nationals and Blocked Persons)."
            );
        }
        if (code.contains("un_sc") || code.contains("unsc") || code.contains("un_") || yId.startsWith("un-") || code.contains("nations unies") || code.contains("united nations")) {
            return new DatasetMeta(
                "Nations Unies 🇺🇳 (Conseil de Sécurité)",
                "Conseil de Sécurité de l'ONU (Comités des sanctions CSNU 1267, 1989, 2253...)",
                "Liste récapitulative consolidée des sanctions et embargos internationaux adoptés en application des résolutions contraignantes de l'ONU."
            );
        }
        if (code.contains("dfat") || code.contains("au_") || yId.startsWith("au-") || code.contains("australia") || code.contains("dfat-")) {
            return new DatasetMeta(
                "DFAT 🇦🇺 (Australie)",
                "Department of Foreign Affairs and Trade (Gouvernement Australien)",
                "Registre officiel consolidé des personnes et entités soumises aux sanctions financières autonomes et ciblées australiennes."
            );
        }
        if (code.contains("seco") || code.contains("ch_") || yId.startsWith("ch-") || code.contains("suisse") || code.contains("switzerland")) {
            return new DatasetMeta(
                "SECO 🇨🇭 (Suisse)",
                "Secrétariat d'État à l'économie (Confédération Suisse)",
                "Registre officiel suisse des mesures de coercition, blocages des avoirs et sanctions financières (Loi sur les embargos - LEmb)."
            );
        }
        if (code.contains("gb_hmt") || code.contains("ofsi") || code.contains("gb-") || code.contains("uk_") || code.contains("hm treasury")) {
            return new DatasetMeta(
                "UK OFSI 🇬🇧 (Royaume-Uni)",
                "HM Treasury - Office of Financial Sanctions Implementation",
                "Liste consolidée des sanctions financières du Royaume-Uni (Sanctions and Anti-Money Laundering Act 2018)."
            );
        }
        if (code.contains("interpol") || yId.startsWith("interpol-")) {
            return new DatasetMeta(
                "Interpol 🌐 (Notices Rouges)",
                "Organisation Internationale de Police Criminelle (OIPC - Interpol)",
                "Signalements criminels et mandats d'arrêt internationaux pour infractions graves et crimes financiers."
            );
        }
        if (code.contains("pep") || code.contains("everypolitician") || code.contains("wd_peps") || code.contains("politician")) {
            return new DatasetMeta(
                "Registre International des PPE",
                "Registres de transparence institutionnels et répertoires publics mondiaux",
                "Base de vigilance renforcée recensant les Personnes Politiquement Exposées, parlementaires, membres de gouvernement et leurs proches (Art. L.561-10 CMF)."
            );
        }
        if (code.contains("worldbank") || code.contains("iadb") || code.contains("afdb") || code.contains("ebrd") || code.contains("debarment")) {
            return new DatasetMeta(
                "Banques Multilatérales de Développement",
                "Banque Mondiale, Banque Africaine de Développement, BERD, BID",
                "Liste consolidée des personnes et entreprises exclues des marchés pour manquements éthiques, fraude ou corruption."
            );
        }

        String fallbackName = datasetId != null && !datasetId.trim().isEmpty() 
            ? datasetId.replace("_", " ").replace("-", " ").toUpperCase() 
            : "Registre Réglementaire Consolidé";
        return new DatasetMeta(
            fallbackName,
            "Autorités de Contrôle & Registres Officiels LCB-FT",
            "Base de données réglementaire officielle pour le contrôle de vigilance et le filtrage des sanctions internationales."
        );
    }

    private JsonNode findEntityNode(JsonNode raw, String targetId) {
        if (raw == null || raw.isNull()) return null;
        if (raw.has("caption") || raw.has("properties")) {
            return raw;
        }
        if (raw.has("responses") && raw.get("responses").isObject()) {
            java.util.Iterator<Map.Entry<String, JsonNode>> fields = raw.get("responses").fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> entry = fields.next();
                JsonNode queryNode = entry.getValue();
                if (queryNode != null && queryNode.has("results") && queryNode.get("results").isArray()) {
                    for (JsonNode res : queryNode.get("results")) {
                        if (targetId != null && res.has("id") && targetId.equalsIgnoreCase(res.get("id").asText())) {
                            return res;
                        }
                    }
                    if (queryNode.get("results").size() > 0) {
                        return queryNode.get("results").get(0);
                    }
                }
            }
        }
        if (raw.isArray()) {
            for (JsonNode res : raw) {
                if (targetId != null && res.has("id") && targetId.equalsIgnoreCase(res.get("id").asText())) {
                    return res;
                }
            }
            if (raw.size() > 0) return raw.get(0);
        }
        if (raw.has("results") && raw.get("results").isArray()) {
            for (JsonNode res : raw.get("results")) {
                if (targetId != null && res.has("id") && targetId.equalsIgnoreCase(res.get("id").asText())) {
                    return res;
                }
            }
            if (raw.get("results").size() > 0) return raw.get("results").get(0);
        }
        return null;
    }

    private String extractTargetName(ScreeningMatch match, JsonNode entityNode) {
        if (entityNode != null) {
            if (entityNode.has("caption") && !entityNode.get("caption").asText().trim().isEmpty()) {
                return entityNode.get("caption").asText().trim();
            }
            if (entityNode.has("properties") && entityNode.get("properties").has("name")) {
                JsonNode nameNode = entityNode.get("properties").get("name");
                if (nameNode.isArray() && nameNode.size() > 0) {
                    return nameNode.get(0).asText().trim();
                } else if (!nameNode.asText().trim().isEmpty()) {
                    return nameNode.asText().trim();
                }
            }
        }
        if (match.getTargetName() != null && !match.getTargetName().trim().isEmpty() && !match.getTargetName().startsWith("Entité ")) {
            return match.getTargetName().trim();
        }
        return "Cible Réglementaire Identifiée (" + (match.getYenteId() != null ? match.getYenteId() : "N/D") + ")";
    }

    private List<String> extractDatasets(ScreeningMatch match, JsonNode entityNode) {
        List<String> datasets = new ArrayList<>();
        if (entityNode != null && entityNode.has("datasets") && entityNode.get("datasets").isArray()) {
            for (JsonNode d : entityNode.get("datasets")) {
                datasets.add(d.asText());
            }
        }
        if (datasets.isEmpty() && entityNode != null && entityNode.has("properties")) {
            JsonNode props = entityNode.get("properties");
            if (props.has("dataset") && props.get("dataset").isArray()) {
                for (JsonNode d : props.get("dataset")) datasets.add(d.asText());
            }
            if (props.has("program") && props.get("program").isArray()) {
                for (JsonNode d : props.get("program")) datasets.add(d.asText());
            }
        }
        if (datasets.isEmpty() && match.getYenteId() != null) {
            datasets.add(match.getYenteId());
        }
        return datasets;
    }

    private String formatScreeningMatchesHtml(List<ScreeningMatch> matches) {
        if (matches == null || matches.isEmpty()) return "";
        StringBuilder sf = new StringBuilder();
        sf.append("<br><br><font color='#0E7490' size='4'><b>--- DÉTAIL DES CORRESPONDANCES RÉGLEMENTAIRES (LCB-FT) ---</b></font><br>");
        sf.append("<font color='#CBD5E1'>____________________________________________________________________</font><br><br>");
        
        java.time.format.DateTimeFormatter dtf = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        int count = 1;
        for (ScreeningMatch match : matches) {
            JsonNode entityNode = findEntityNode(match.getRawResponse(), match.getYenteId());
            String targetName = extractTargetName(match, entityNode);
            List<String> datasets = extractDatasets(match, entityNode);
            String primaryDataset = !datasets.isEmpty() ? datasets.get(0) : match.getYenteId();
            DatasetMeta dsMeta = resolveDatasetMeta(primaryDataset, match.getYenteId());

            sf.append("<font color='#0F172A' size='3.5'><b>#").append(count++).append(" - Cible : ").append(targetName).append("</b></font><br>");
            
            // Registre Officiel & Description
            sf.append("<b><font color='#0E7490' size='2.5'>Registre Officiel : </font></b><font color='#0F172A' size='2.5'><b>")
              .append(dsMeta.name).append("</b></font><br>");
            sf.append("<i><font color='#64748B' size='2'>&nbsp;&nbsp;&#8226; Autorité : ").append(dsMeta.authority).append("</font></i><br>");
            sf.append("<i><font color='#475569' size='2'>&nbsp;&nbsp;&#8226; Description : ").append(dsMeta.description).append("</font></i><br>");
            
            // Identifiant officiel
            String refIdStr = match.getYenteId() != null ? match.getYenteId() : "N/D";
            sf.append("<i><font color='#64748B' size='2.5'>Référence Officielle Cible : </font></i><font color='#0F172A' size='2.5'><b>")
              .append(refIdStr).append("</b></font><br>");
            
            // Score de similarité
            String scoreStr = match.getScore() != null ? String.format("%.2f%%", match.getScore() * 100) : "N/A";
            String scoreColor = match.getScore() != null && match.getScore() > 0.8 ? "#DC2626" : "#D97706";
            sf.append("<i><font color='#64748B' size='2.5'>Score de similarité : </font></i><font color='").append(scoreColor).append("' size='2.5'><b>")
              .append(scoreStr).append("</b></font><br>");
            
            // Statut & Décision
            String rawStatus = match.getStatus() != null ? match.getStatus().name() : "PENDING";
            String statusLabel;
            String statusColor;
            switch (rawStatus) {
                case "FALSE_POSITIVE":
                    statusLabel = "FAUX POSITIF (Homonymie écartée)";
                    statusColor = "#16A34A";
                    break;
                case "TRUE_POSITIVE_SANCTION":
                case "TRUE_POSITIVE":
                    statusLabel = "VRAI POSITIF (Cible sous Sanctions)";
                    statusColor = "#DC2626";
                    break;
                case "TRUE_POSITIVE_PEP":
                    statusLabel = "VRAI POSITIF (Personne Politiquement Exposée - PPE)";
                    statusColor = "#D97706";
                    break;
                case "DILIGENCE_REQUIRED":
                    statusLabel = "DILIGENCE APPROFONDIE REQUISE";
                    statusColor = "#EA580C";
                    break;
                case "CLEARED":
                    statusLabel = "CONFORME (Alerte Validée)";
                    statusColor = "#16A34A";
                    break;
                case "REJECTED":
                    statusLabel = "REJETÉ (Alerte Critique)";
                    statusColor = "#DC2626";
                    break;
                default:
                    statusLabel = "EN ATTENTE D'ANALYSE (Alerte Ouverte)";
                    statusColor = "#64748B";
                    break;
            }
            sf.append("<i><font color='#64748B' size='2.5'>Décision de conformité : </font></i><font color='").append(statusColor).append("' size='2.5'><b>")
              .append(statusLabel).append("</b></font><br>");
            
            // Motif / Typologie
            if (match.getMatchReason() != null && !match.getMatchReason().trim().isEmpty()) {
                sf.append("<i><font color='#64748B' size='2.5'>Typologie d'alerte : </font></i><font color='#0F172A' size='2.5'>")
                  .append(match.getMatchReason().replace("\n", " ")).append("</font><br>");
            }
            if (match.getCreatedAt() != null) {
                sf.append("<i><font color='#64748B' size='2.5'>Date du criblage : </font></i><font color='#0F172A' size='2.5'>")
                  .append(match.getCreatedAt().format(dtf)).append("</font><br>");
            }
            if (match.getReviewerComment() != null && !match.getReviewerComment().trim().isEmpty()) {
                sf.append("<i><font color='#64748B' size='2.5'>Commentaire de revue : </font></i><font color='#0F172A' size='2.5'><b>")
                  .append(match.getReviewerComment().replace("\n", " ")).append("</b></font><br>");
            }
            if (match.getReviewedBy() != null && !match.getReviewedBy().trim().isEmpty()) {
                sf.append("<i><font color='#64748B' size='2.5'>Décision prise par : </font></i><font color='#0F172A' size='2.5'>")
                  .append(match.getReviewedBy());
                if (match.getReviewedAt() != null) sf.append(" le ").append(match.getReviewedAt().format(dtf));
                sf.append("</font><br>");
            }
            sf.append("<br><font color='#E2E8F0'>- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -</font><br><br>");
        }
        return sf.toString();
    }
}


