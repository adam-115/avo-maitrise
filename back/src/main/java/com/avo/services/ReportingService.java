package com.avo.services;

import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.io.ByteArrayOutputStream;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import com.avo.dtos.CabinetProfileDTO;
import com.avo.entities.ClientEntity;
import com.avo.entities.Invoice;
import com.avo.entities.InvoiceTimeEntry;
import com.avo.repositories.InvoiceRepository;

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

    public ReportingService(InvoiceRepository invoiceRepository, CabinetProfileService cabinetProfileService) {
        this.invoiceRepository = invoiceRepository;
        this.cabinetProfileService = cabinetProfileService;
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
}
