package com.avo.audit.timeline;

import com.avo.audit.AuditContext;
import com.avo.audit.seal.AuditIntegrityReport;
import com.avo.audit.seal.AuditIntegrityService;
import com.avo.repositories.CabinetProfileRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Rapport PDF « journal d'audit » d'un client ou d'un dossier, à remettre au bâtonnier :
 * certificat d'intégrité (résultat de la vérification + empreintes finales des chaînes), puis la
 * chronologie complète des accès et des modifications, du plus récent au plus ancien.
 *
 * Les empreintes finales imprimées servent d'ancrage externe : conservées avec le PDF, elles permettent
 * de prouver plus tard que le journal n'a pas été réécrit depuis la date du rapport.
 */
@Service
public class AuditPdfService {

    private static final Color INK = new Color(0x0F, 0x17, 0x2A);
    private static final Color MUTED = new Color(0x64, 0x74, 0x8B);
    private static final Color ACCENT = new Color(0xBE, 0x18, 0x5D);
    private static final Color LINE = new Color(0xE2, 0xE8, 0xF0);
    private static final Color OK_BG = new Color(0xEC, 0xFD, 0xF5);
    private static final Color OK = new Color(0x04, 0x78, 0x57);
    private static final Color KO_BG = new Color(0xFE, 0xF2, 0xF2);
    private static final Color KO = new Color(0xB9, 0x1C, 0x1C);
    private static final Color HEAD_BG = new Color(0xF8, 0xFA, 0xFC);

    private static final Font TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 17, INK);
    private static final Font SUBTITLE = FontFactory.getFont(FontFactory.HELVETICA, 9.5f, MUTED);
    private static final Font SECTION = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11.5f, ACCENT);
    private static final Font BODY = FontFactory.getFont(FontFactory.HELVETICA, 8.5f, INK);
    private static final Font BODY_BOLD = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, INK);
    private static final Font SMALL = FontFactory.getFont(FontFactory.HELVETICA, 7.5f, MUTED);
    private static final Font MONO = FontFactory.getFont(FontFactory.COURIER, 7.5f, INK);
    private static final Font TABLE_HEAD = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8f, INK);

    private final AuditTimelineService timelineService;
    private final AuditIntegrityService integrityService;
    private final CabinetProfileRepository cabinetRepository;

    public AuditPdfService(AuditTimelineService timelineService, AuditIntegrityService integrityService,
            CabinetProfileRepository cabinetRepository) {
        this.timelineService = timelineService;
        this.integrityService = integrityService;
        this.cabinetRepository = cabinetRepository;
    }

    public byte[] generate(String scope, long id) {
        List<TimelineEntry> entries = timelineService.timeline(scope, id);
        AuditIntegrityReport integrity = integrityService.verify();
        String cabinet = cabinetRepository.findAll().stream().findFirst()
                .map(c -> c.getName()).filter(n -> n != null && !n.isBlank()).orElse("Cabinet");

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4.rotate(), 30, 30, 30, 36);
        PdfWriter writer = PdfWriter.getInstance(doc, out);
        String generatedBy = AuditContext.currentUser();
        LocalDateTime generatedAt = LocalDateTime.now();
        writer.setPageEvent(new Footer(cabinet, generatedAt));
        doc.addTitle("Journal d'audit – " + AuditLabels.resourceType(scope) + " #" + id);
        doc.addCreator("Avo-Maîtrise");
        doc.open();

        // En-tête
        doc.add(new Paragraph(cabinet, SUBTITLE));
        Paragraph title = new Paragraph("Journal d'audit – " + AuditLabels.resourceType(scope) + " #" + id, TITLE);
        title.setSpacingBefore(2);
        doc.add(title);
        doc.add(new Paragraph("Rapport généré le " + generatedAt.format(AuditLabels.DATE_TIME) + " par " + generatedBy
                + " · " + entries.size() + " événement(s)"
                + (entries.size() >= AuditTimelineService.MAX_ENTRIES ? " (limité aux plus récents)" : ""), SUBTITLE));

        // Certificat d'intégrité
        addSection(doc, "1. Certificat d'intégrité du journal");
        boolean intact = integrity.getStatus() == AuditIntegrityReport.Status.INTACT;
        PdfPTable cert = new PdfPTable(1);
        cert.setWidthPercentage(100);
        PdfPCell certCell = new PdfPCell();
        certCell.setBackgroundColor(intact ? OK_BG : KO_BG);
        certCell.setBorderColor(intact ? OK : KO);
        certCell.setPadding(8);
        certCell.addElement(new Paragraph(intact
                ? "JOURNAL INTACT – aucune modification, suppression ou insertion a posteriori détectée."
                : "ANOMALIES DÉTECTÉES (" + integrity.getAnomalyCount() + ") – voir le détail ci-dessous.",
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, intact ? OK : KO)));
        certCell.addElement(new Paragraph("Vérification du " + integrity.getVerifiedAt().format(AuditLabels.DATE_TIME)
                + " · scellement " + integrity.getCurrentAlgorithm()
                + (integrity.isKeyConfigured() ? " avec clé secrète" : " SANS clé secrète (mode développement)")
                + " · tables protégées en ajout seul : " + integrity.getProtectedTables() + "/"
                + (integrity.getProtectedTables() + integrity.getUnprotectedTables()), BODY));
        cert.addCell(certCell);
        doc.add(cert);

        PdfPTable chains = table(new float[]{2.2f, 1.2f, 1.2f, 1f, 6f},
                "Chaîne", "Éléments scellés", "En attente", "Dernier n°", "Empreinte finale (à conserver)");
        for (AuditIntegrityReport.ChainSummary c : integrity.getChains()) {
            cell(chains, "CONSULTATIONS".equals(c.chain()) ? "Accès (consultations, exports…)" : "Modifications", BODY);
            cell(chains, String.valueOf(c.sealedItems()), BODY);
            cell(chains, String.valueOf(c.pendingItems()), BODY);
            cell(chains, c.lastSeq() == null ? "–" : String.valueOf(c.lastSeq()), BODY);
            cell(chains, c.lastHash() == null ? "–" : c.lastHash(), MONO);
        }
        doc.add(chains);
        if (!intact) {
            PdfPTable anomalies = table(new float[]{2f, 1.6f, 1f, 7f}, "Anomalie", "Chaîne", "Élément", "Description");
            for (AuditIntegrityReport.Anomaly a : integrity.getAnomalies()) {
                cell(anomalies, a.type(), BODY_BOLD);
                cell(anomalies, a.chain() == null ? "–" : a.chain(), BODY);
                cell(anomalies, a.itemId() == null ? "–" : String.valueOf(a.itemId()), BODY);
                cell(anomalies, a.description(), BODY);
            }
            doc.add(anomalies);
        }
        Paragraph note = new Paragraph("Les empreintes finales ci-dessus scellent l'ensemble du journal à la date du rapport. "
                + "Conservées avec ce document, elles permettent de démontrer ultérieurement que le journal n'a pas été réécrit.", SMALL);
        note.setSpacingBefore(4);
        doc.add(note);

        // Chronologie
        addSection(doc, "2. Chronologie des accès et des modifications");
        PdfPTable timeline = table(new float[]{1.5f, 2.1f, 1.3f, 2.6f, 5.5f},
                "Date", "Utilisateur", "Action", "Élément", "Détail");
        timeline.setHeaderRows(1);
        for (TimelineEntry e : entries) {
            boolean refused = "REFUSE".equals(e.outcome()) || "ECHEC".equals(e.outcome());
            cell(timeline, e.time() == null ? "–" : e.time().format(AuditLabels.DATE_TIME), BODY);
            cell(timeline, (e.user() == null ? "–" : e.user()) + (e.ipAddress() != null ? "\n" + e.ipAddress() : ""), BODY);
            cell(timeline, AuditLabels.action(e.action()) + (refused ? "\n(" + e.outcome() + ")" : ""),
                    refused ? FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, KO) : BODY_BOLD);
            cell(timeline, e.resourceLabel(), BODY);
            cell(timeline, detail(e), BODY);
        }
        if (entries.isEmpty()) {
            PdfPCell empty = new PdfPCell(new Phrase("Aucun événement enregistré.", BODY));
            empty.setColspan(5);
            empty.setPadding(6);
            timeline.addCell(empty);
        }
        doc.add(timeline);
        doc.close();
        return out.toByteArray();
    }

    private static String detail(TimelineEntry e) {
        if (e.changes() == null || e.changes().isEmpty()) {
            return e.summary();
        }
        String lines = e.changes().stream().limit(12).map(c -> {
            if ("CREATION".equals(e.action()) || c.before() == null && c.after() != null) {
                return "• " + c.label() + " : " + c.after();
            }
            if (c.after() == null) {
                return "• " + c.label() + " : " + c.before() + " → (vide)";
            }
            return "• " + c.label() + " : " + c.before() + " → " + c.after();
        }).collect(Collectors.joining("\n"));
        return lines + (e.changes().size() > 12 ? "\n… " + (e.changes().size() - 12) + " autre(s) champ(s)" : "");
    }

    private static void addSection(Document doc, String text) {
        Paragraph p = new Paragraph(text, SECTION);
        p.setSpacingBefore(12);
        p.setSpacingAfter(5);
        doc.add(p);
    }

    private static PdfPTable table(float[] widths, String... headers) {
        PdfPTable t = new PdfPTable(widths);
        t.setWidthPercentage(100);
        t.setSpacingBefore(4);
        for (String h : headers) {
            PdfPCell c = new PdfPCell(new Phrase(h, TABLE_HEAD));
            c.setBackgroundColor(HEAD_BG);
            c.setBorderColor(LINE);
            c.setPadding(5);
            t.addCell(c);
        }
        return t;
    }

    private static void cell(PdfPTable t, String text, Font font) {
        PdfPCell c = new PdfPCell(new Phrase(text == null ? "" : text, font));
        c.setBorderColor(LINE);
        c.setPadding(4.5f);
        t.addCell(c);
    }

    /** Pied de page : cabinet, date de génération, pagination. */
    private static final class Footer extends PdfPageEventHelper {
        private final String cabinet;
        private final LocalDateTime generatedAt;

        Footer(String cabinet, LocalDateTime generatedAt) {
            this.cabinet = cabinet;
            this.generatedAt = generatedAt;
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfContentByte cb = writer.getDirectContent();
            Phrase left = new Phrase(cabinet + " · Journal d'audit généré le " + generatedAt.format(AuditLabels.DATE_TIME)
                    + " · Document confidentiel", SMALL);
            Phrase right = new Phrase("Page " + writer.getPageNumber(), SMALL);
            ColumnText.showTextAligned(cb, Element.ALIGN_LEFT, left, document.left(), document.bottom() - 18, 0);
            ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT, right, document.right(), document.bottom() - 18, 0);
        }
    }
}
