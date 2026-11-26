package com.avo.services;

import java.io.InputStream;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import static org.junit.jupiter.api.Assertions.*;

import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.data.JRMapCollectionDataSource;

public class FatfReportGenerationTest {

    @Test
    public void testFatfReportCompilationAndFill() throws Exception {
        InputStream reportStream = new ClassPathResource("report/templates/client_fatf_audit.jrxml").getInputStream();
        assertNotNull(reportStream, "JRXML template should exist");

        JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);
        assertNotNull(jasperReport, "JasperReport should compile cleanly");

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("cabinetName", "SI-LEGAL");
        parameters.put("cabinetAddress", "59 rue de l'église\nDudelange");
        parameters.put("cabinetPhone", "661425524");
        parameters.put("cabinetEmail", "adam.laftimi@gmail.com");
        parameters.put("reportDate", "06/09/2026");
        parameters.put("auditRef", "GAFI-2026-CL0167");
        parameters.put("clientName", "Vladimir Vladimirovich PUTIN");
        parameters.put("clientType", "Personne Physique");
        parameters.put("clientRegistration", "CIN: 0001");
        parameters.put("clientEmail", "adam.laftimi@gmail.com");
        parameters.put("clientPhone", "691209800");
        parameters.put("clientAddress", "GD charlotte, 79, Gd Charlotte");
        parameters.put("clientCountry", "Luxembourg");
        parameters.put("clientSector", "AGR");
        parameters.put("clientCreationDate", "06/09/2026");
        parameters.put("countryFatfRisk", "Risque Standard (Conforme GAFI)");
        parameters.put("clientStatus", "CONFORME LCB-FT");
        parameters.put("riskLevel", "ÉLEVÉ (91%)");
        parameters.put("matchesCount", "3 alerte(s)");
        parameters.put("lastScreeningDate", "06/09/2026 à 21:06");
        parameters.put("expertComment", "[DÉCLARATION DE CONFORMITÉ GAFI / FATF] : Dossier de vigilance clientèle (CDD) constitué et audité en conformité avec les Recommandations 1, 10, 12, 19, 22 et 24 du GAFI.\n\nMESURES DE VIGILANCE RENFORCÉE (EDD) : Alertes analysées.\n\n[REGISTRES AUDITÉS] : ONU, OFAC, UE, DG Trésor, SECO, OFSI.");

        StringBuilder matchesHtml = new StringBuilder();
        matchesHtml.append("<br><font color='#0E7490' size='3.5'><b>5. DÉTAIL DES CONTRÔLES &amp; CORRESPONDANCES RÉGLEMENTAIRES (LCB-FT)</b></font><br>");
        matchesHtml.append("<font color='#94A3B8'>____________________________________________________________________</font><br><br>");
        matchesHtml.append("<font color='#0F172A' size='3'><b>#1 • Cible : Vladimir Vladimirovich PUTIN</b></font><br>");
        matchesHtml.append("<b><font color='#0E7490' size='2.5'>Registre Officiel : </font></b><font color='#0F172A' size='2.5'><b>Union Européenne (UE FSF)</b></font> &nbsp;<font color='#64748B'>|</font>&nbsp; <i><font color='#64748B' size='2'>Réf : eu-fsd-135909</font></i><br>");
        matchesHtml.append("<i><font color='#64748B' size='2'>&nbsp;&nbsp;&#8226; Autorité : Commission Européenne &amp; SEAE</font></i><br>");
        matchesHtml.append("<b><font color='#0F172A' size='2.5'>Score similarité : </font></b><font color='#DC2626' size='2.5'><b>90,91%</b></font> &nbsp;<font color='#64748B'>|</font>&nbsp; <b><font color='#0F172A' size='2.5'>Décision : </font></b><font color='#16A34A' size='2.5'><b>FAUX POSITIF (Homonymie écartée)</b></font><br>");
        matchesHtml.append("<i><font color='#64748B' size='2'>Date criblage : 06/09/2026 21:06</font></i> &nbsp;<font color='#CBD5E1'>|</font>&nbsp; <i><font color='#64748B' size='2'>Décision par : Avocat Référent LCB-FT le 06/09/2026 21:07</font></i><br>");
        matchesHtml.append("<b><font color='#0E7490' size='2'>Commentaire de revue : </font></b><font color='#0F172A' size='2'><b>Nationalité et pays de résidence formellement distincts de la cible sous surveillance.</b></font><br>");
        matchesHtml.append("<font color='#E2E8F0'>____________________________________________________________________</font><br><br>");
        parameters.put("diligenceFormDetails", matchesHtml.toString());

        List<Map<String, ?>> dataSourceList = new ArrayList<>();
        Map<String, Object> row = new HashMap<>();
        row.put("uboName", "Vladimir Vladimirovich PUTIN (Titulaire)");
        row.put("roleAndOwnership", "Auto-détention directe (100%)");
        row.put("nationality", "Luxembourg");
        row.put("riskLevel", "ÉLEVÉ (91%)");
        row.put("amlStatus", "CONFORME LCB-FT");
        dataSourceList.add(row);

        JRMapCollectionDataSource dataSource = new JRMapCollectionDataSource(dataSourceList);
        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);
        assertNotNull(jasperPrint, "JasperPrint should fill cleanly");

        byte[] pdfBytes = JasperExportManager.exportReportToPdf(jasperPrint);
        assertNotNull(pdfBytes, "PDF bytes should not be null");
        assertTrue(pdfBytes.length > 1000, "PDF should have content");
    }
}
