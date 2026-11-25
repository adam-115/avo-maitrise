package com.avo.services.export;

import com.avo.entities.CabinetProfile;
import com.avo.entities.Dossier;
import com.avo.entities.Note;
import com.avo.repositories.CabinetProfileRepository;
import com.avo.repositories.DossierRepository;
import com.avo.repositories.NoteRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.xwpf.model.XWPFHeaderFooterPolicy;
import org.apache.poi.xwpf.usermodel.*;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigInteger;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Génère des documents Microsoft Word (.docx) propres et directement éditables
 * (en-tête cabinet, cartouche dossier, titres, gras/italique, puces, citations [S#], tableau des sources).
 */
@Service
@Slf4j
public class WordExportService {

    private static final String COLOR_NAVY = "1E3A8A";
    private static final String COLOR_INDIGO = "312E81";
    private static final String COLOR_SLATE = "334155";
    private static final String COLOR_MUTED = "64748B";
    private static final String COLOR_CITE = "BE185D";
    private static final String FONT_FAMILY = "Calibri";

    private static final DateTimeFormatter FR_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy 'à' HH:mm");
    private static final Pattern INLINE_TOKEN = Pattern.compile("(\\*\\*[^*]+\\*\\*|\\*[^*]+\\*|\\[S\\d+(?:\\s*[,;]\\s*S\\d+)*\\])");

    public record ExportedDocx(String filename, byte[] bytes) {}

    private final DossierRepository dossierRepository;
    private final NoteRepository noteRepository;
    private final CabinetProfileRepository cabinetProfileRepository;
    private final ObjectMapper objectMapper;

    public WordExportService(DossierRepository dossierRepository,
                             NoteRepository noteRepository,
                             CabinetProfileRepository cabinetProfileRepository,
                             ObjectMapper objectMapper) {
        this.dossierRepository = dossierRepository;
        this.noteRepository = noteRepository;
        this.cabinetProfileRepository = cabinetProfileRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public ExportedDocx exportDossierStrategy(Long dossierId) {
        Dossier dossier = dossierRepository.findById(dossierId)
                .orElseThrow(() -> new IllegalArgumentException("Dossier introuvable : " + dossierId));
        if (dossier.getAiStrategy() == null || dossier.getAiStrategy().isBlank()) {
            throw new IllegalStateException("Aucune stratégie IA n'a encore été générée pour ce dossier.");
        }

        CabinetProfile cabinet = loadCabinetProfile();
        try (XWPFDocument doc = new XWPFDocument()) {
            configurePageMargins(doc);
            addFooter(doc, cabinet);
            addCabinetHeader(doc, cabinet);
            addDocumentTitle(doc, "NOTE DE STRATÉGIE JURIDIQUE (AVOCAT IA)");
            addDossierMetadataTable(doc, dossier);

            // Contenu Markdown structuré
            renderMarkdownContent(doc, dossier.getAiStrategy());

            // Annexe : Sources consultées & Vérification
            if (dossier.getAiStrategySources() != null && !dossier.getAiStrategySources().isBlank()) {
                appendSourcesSection(doc, dossier.getAiStrategySources());
            }

            String safeRef = sanitizeFilename(dossier.getReferenceInterne() != null ? dossier.getReferenceInterne() : "dossier-" + dossierId);
            return new ExportedDocx("Strategie_" + safeRef + ".docx", toBytes(doc));
        } catch (Exception e) {
            throw new RuntimeException("Erreur génération Word Stratégie : " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public ExportedDocx exportDossierChat(Long dossierId) {
        Dossier dossier = dossierRepository.findById(dossierId)
                .orElseThrow(() -> new IllegalArgumentException("Dossier introuvable : " + dossierId));
        if (dossier.getAiChatHistory() == null || dossier.getAiChatHistory().isBlank()) {
            throw new IllegalStateException("Aucune discussion IA n'est enregistrée pour ce dossier.");
        }

        CabinetProfile cabinet = loadCabinetProfile();
        try (XWPFDocument doc = new XWPFDocument()) {
            configurePageMargins(doc);
            addFooter(doc, cabinet);
            addCabinetHeader(doc, cabinet);
            addDocumentTitle(doc, "COMPTE-RENDU D'ÉCHANGES — AVOCAT IA");
            addDossierMetadataTable(doc, dossier);

            JsonNode history = objectMapper.readTree(dossier.getAiChatHistory());
            if (history.isArray()) {
                int idx = 1;
                for (JsonNode msg : history) {
                    String role = msg.path("role").asText("user");
                    String content = msg.path("content").asText("");
                    boolean isUser = "user".equalsIgnoreCase(role);

                    XWPFParagraph header = doc.createParagraph();
                    header.setSpacingBefore(220);
                    header.setSpacingAfter(60);
                    XWPFRun hr = header.createRun();
                    hr.setFontFamily(FONT_FAMILY);
                    hr.setFontSize(11);
                    hr.setBold(true);
                    hr.setColor(isUser ? COLOR_NAVY : COLOR_INDIGO);
                    hr.setText(isUser ? ("Question #" + idx + " (Avocat)") : ("Réponse Avocat IA #" + idx));
                    if (!isUser) idx++;

                    renderMarkdownContent(doc, content);
                }
            }

            String safeRef = sanitizeFilename(dossier.getReferenceInterne() != null ? dossier.getReferenceInterne() : "dossier-" + dossierId);
            return new ExportedDocx("Discussion_IA_" + safeRef + ".docx", toBytes(doc));
        } catch (Exception e) {
            throw new RuntimeException("Erreur génération Word Discussion IA : " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public ExportedDocx exportNote(Long noteId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new IllegalArgumentException("Note introuvable : " + noteId));

        CabinetProfile cabinet = loadCabinetProfile();
        try (XWPFDocument doc = new XWPFDocument()) {
            configurePageMargins(doc);
            addFooter(doc, cabinet);
            addCabinetHeader(doc, cabinet);
            addDocumentTitle(doc, note.getTitle() != null ? note.getTitle() : "NOTE DE DOSSIER");

            if (note.getDossier() != null) {
                addDossierMetadataTable(doc, note.getDossier());
            }

            XWPFParagraph meta = doc.createParagraph();
            meta.setSpacingBefore(80);
            meta.setSpacingAfter(180);
            XWPFRun mr = meta.createRun();
            mr.setFontFamily(FONT_FAMILY);
            mr.setFontSize(9.5);
            mr.setItalic(true);
            mr.setColor(COLOR_MUTED);
            String cat = note.getCategory() != null && note.getCategory().getLabel() != null ? note.getCategory().getLabel() : "Note";
            String author = note.getAuteur() != null && note.getAuteur().getUsername() != null ? note.getAuteur().getUsername() : "Cabinet";
            mr.setText("Catégorie : " + cat + "   •   Auteur : " + author);

            renderMarkdownContent(doc, note.getDescription() != null ? note.getDescription() : "");

            String safeTitle = sanitizeFilename(note.getTitle() != null ? note.getTitle() : "note-" + noteId);
            return new ExportedDocx("Note_" + safeTitle + ".docx", toBytes(doc));
        } catch (Exception e) {
            throw new RuntimeException("Erreur génération Word Note : " + e.getMessage(), e);
        }
    }

    // ==================== MISE EN PAGE WORD ====================

    private void configurePageMargins(XWPFDocument doc) {
        CTSectPr sectPr = doc.getDocument().getBody().addNewSectPr();
        CTPageMar pageMar = sectPr.addNewPgMar();
        pageMar.setTop(BigInteger.valueOf(1134));    // ~2 cm
        pageMar.setBottom(BigInteger.valueOf(1134));
        pageMar.setLeft(BigInteger.valueOf(1134));
        pageMar.setRight(BigInteger.valueOf(1134));
    }

    private void addFooter(XWPFDocument doc, CabinetProfile cabinet) {
        XWPFHeaderFooterPolicy policy = new XWPFHeaderFooterPolicy(doc);
        XWPFFooter footer = policy.createFooter(XWPFHeaderFooterPolicy.DEFAULT);
        XWPFParagraph p = footer.createParagraph();
        p.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun r = p.createRun();
        r.setFontFamily(FONT_FAMILY);
        r.setFontSize(8.5);
        r.setColor(COLOR_MUTED);
        String cabName = cabinet != null && cabinet.getName() != null ? cabinet.getName() : "Avo-Maîtrise";
        r.setText("Document confidentiel — " + cabName + " • Généré le " + LocalDateTime.now().format(FR_DATE));
    }

    private void addCabinetHeader(XWPFDocument doc, CabinetProfile cabinet) {
        XWPFParagraph p = doc.createParagraph();
        p.setSpacingAfter(40);
        XWPFRun nameRun = p.createRun();
        nameRun.setFontFamily(FONT_FAMILY);
        nameRun.setFontSize(14);
        nameRun.setBold(true);
        nameRun.setColor(COLOR_NAVY);
        nameRun.setText(cabinet != null && cabinet.getName() != null && !cabinet.getName().isBlank()
                ? cabinet.getName().toUpperCase()
                : "CABINET D'AVOCATS — AVO-MAÎTRISE");

        if (cabinet != null) {
            StringBuilder contact = new StringBuilder();
            appendPart(contact, cabinet.getAddress());
            appendPart(contact, joinSpace(cabinet.getPostalCode(), cabinet.getCity()));
            appendPart(contact, cabinet.getPhone());
            appendPart(contact, cabinet.getEmail());
            if (!contact.isEmpty()) {
                XWPFParagraph sub = doc.createParagraph();
                sub.setSpacingAfter(120);
                sub.setBorderBottom(Borders.SINGLE);
                XWPFRun sr = sub.createRun();
                sr.setFontFamily(FONT_FAMILY);
                sr.setFontSize(9);
                sr.setColor(COLOR_MUTED);
                sr.setText(contact.toString());
            }
        }
    }

    private void addDocumentTitle(XWPFDocument doc, String title) {
        XWPFParagraph p = doc.createParagraph();
        p.setSpacingBefore(180);
        p.setSpacingAfter(180);
        XWPFRun r = p.createRun();
        r.setFontFamily(FONT_FAMILY);
        r.setFontSize(16);
        r.setBold(true);
        r.setColor(COLOR_INDIGO);
        r.setText(title);
    }

    private void addDossierMetadataTable(XWPFDocument doc, Dossier dossier) {
        XWPFTable table = doc.createTable(4, 2);
        table.setWidth("100%");
        styleTableBorders(table, "CBD5E1");

        String clientName = dossier.getClient() != null && dossier.getClient().getDisplayName() != null
                ? dossier.getClient().getDisplayName()
                : "Non renseigné";
        String pays = dossier.getPaysJuridiction() != null ? dossier.getPaysJuridiction() : "Non défini";

        setMetaRow(table.getRow(0), "Référence dossier", dossier.getReferenceInterne() != null ? dossier.getReferenceInterne() : "#" + dossier.getId());
        setMetaRow(table.getRow(1), "Intitulé du dossier", dossier.getTitre() != null ? dossier.getTitre() : "");
        setMetaRow(table.getRow(2), "Client principal", clientName);
        setMetaRow(table.getRow(3), "Droit applicable & Date", pays + "   •   Édité le " + LocalDateTime.now().format(FR_DATE));

        XWPFParagraph spacer = doc.createParagraph();
        spacer.setSpacingAfter(100);
    }

    private void setMetaRow(XWPFTableRow row, String label, String value) {
        XWPFTableCell c0 = row.getCell(0);
        XWPFTableCell c1 = row.getCell(1);
        c0.setColor("F1F5F9");
        c1.setColor("FFFFFF");
        setCellText(c0, label, true, COLOR_NAVY, 9.5);
        setCellText(c1, value, false, COLOR_SLATE, 9.5);
    }

    private void renderMarkdownContent(XWPFDocument doc, String markdown) {
        if (markdown == null || markdown.isBlank()) return;
        String[] lines = markdown.replace("\r\n", "\n").split("\n");
        for (String rawLine : lines) {
            String line = rawLine.trim();
            if (line.isEmpty()) continue;

            if (line.startsWith("### ")) {
                addSectionHeading(doc, line.substring(4).trim());
            } else if (line.startsWith("## ")) {
                addSectionHeading(doc, line.substring(3).trim());
            } else if (line.startsWith("# ")) {
                addSectionHeading(doc, line.substring(2).trim());
            } else if (line.startsWith("- ") || line.startsWith("* ")) {
                XWPFParagraph p = doc.createParagraph();
                p.setIndentationLeft(420);
                p.setIndentationHanging(220);
                p.setSpacingAfter(70);
                XWPFRun bullet = p.createRun();
                bullet.setFontFamily(FONT_FAMILY);
                bullet.setFontSize(10.5);
                bullet.setBold(true);
                bullet.setColor(COLOR_INDIGO);
                bullet.setText("•  ");
                appendFormattedRuns(p, line.substring(2).trim(), 10.5);
            } else {
                XWPFParagraph p = doc.createParagraph();
                p.setSpacingAfter(90);
                appendFormattedRuns(p, line, 10.5);
            }
        }
    }

    private void addSectionHeading(XWPFDocument doc, String heading) {
        XWPFParagraph p = doc.createParagraph();
        p.setSpacingBefore(240);
        p.setSpacingAfter(100);
        p.setBorderBottom(Borders.SINGLE);
        XWPFRun r = p.createRun();
        r.setFontFamily(FONT_FAMILY);
        r.setFontSize(12.5);
        r.setBold(true);
        r.setColor(COLOR_NAVY);
        r.setText(heading);
    }

    private void appendFormattedRuns(XWPFParagraph p, String text, double fontSize) {
        Matcher m = INLINE_TOKEN.matcher(text);
        int cursor = 0;
        while (m.find()) {
            if (m.start() > cursor) {
                addPlainRun(p, text.substring(cursor, m.start()), fontSize, false, false, COLOR_SLATE);
            }
            String token = m.group(1);
            if (token.startsWith("**") && token.endsWith("**")) {
                addPlainRun(p, token.substring(2, token.length() - 2), fontSize, true, false, "0F172A");
            } else if (token.startsWith("*") && token.endsWith("*")) {
                addPlainRun(p, token.substring(1, token.length() - 1), fontSize, false, true, COLOR_SLATE);
            } else if (token.startsWith("[S")) {
                addPlainRun(p, " " + token + " ", fontSize - 1.0, true, false, COLOR_CITE);
            }
            cursor = m.end();
        }
        if (cursor < text.length()) {
            addPlainRun(p, text.substring(cursor), fontSize, false, false, COLOR_SLATE);
        }
    }

    private void addPlainRun(XWPFParagraph p, String text, double fontSize, boolean bold, boolean italic, String color) {
        XWPFRun r = p.createRun();
        r.setFontFamily(FONT_FAMILY);
        r.setFontSize(fontSize);
        r.setBold(bold);
        r.setItalic(italic);
        r.setColor(color);
        r.setText(text);
    }

    private void appendSourcesSection(XWPFDocument doc, String sourcesJson) {
        try {
            JsonNode root = objectMapper.readTree(sourcesJson);
            JsonNode sources = root.path("sources");
            if (!sources.isArray() || sources.isEmpty()) return;

            addSectionHeading(doc, "Sources consultées & Références vérifiées");

            XWPFTable table = doc.createTable(sources.size() + 1, 4);
            table.setWidth("100%");
            styleTableBorders(table, "CBD5E1");

            XWPFTableRow header = table.getRow(0);
            String[] cols = {"ID", "Source & Page", "Nature", "Extrait / Lien officiel"};
            for (int i = 0; i < cols.length; i++) {
                header.getCell(i).setColor("1E293B");
                setCellText(header.getCell(i), cols[i], true, "FFFFFF", 9);
            }

            for (int i = 0; i < sources.size(); i++) {
                JsonNode s = sources.get(i);
                XWPFTableRow row = table.getRow(i + 1);
                String id = s.path("id").asText("");
                String title = s.path("title").asText("");
                String page = s.hasNonNull("page") && s.get("page").asInt(0) > 0 ? " (p. " + s.get("page").asInt() + ")" : "";
                String kind = s.path("kind").asText("");
                String excerpt = s.path("excerpt").asText("");
                if (excerpt.length() > 220) excerpt = excerpt.substring(0, 220) + "…";
                String url = s.path("officialUrl").asText("");
                String detail = excerpt + (!url.isBlank() ? "\nLien : " + url : "");

                setCellText(row.getCell(0), id, true, COLOR_CITE, 8.5);
                setCellText(row.getCell(1), title + page, true, COLOR_SLATE, 8.5);
                setCellText(row.getCell(2), kind, false, COLOR_MUTED, 8.5);
                setCellText(row.getCell(3), detail, false, COLOR_SLATE, 8.5);
            }
        } catch (Exception e) {
            log.warn("Impossible d'ajouter le tableau des sources au DOCX : {}", e.getMessage());
        }
    }

    private void setCellText(XWPFTableCell cell, String text, boolean bold, String color, double fontSize) {
        XWPFParagraph p = cell.getParagraphs().get(0);
        p.setSpacingBefore(40);
        p.setSpacingAfter(40);
        XWPFRun r = p.createRun();
        r.setFontFamily(FONT_FAMILY);
        r.setFontSize(fontSize);
        r.setBold(bold);
        r.setColor(color);
        r.setText(text != null ? text : "");
    }

    private void styleTableBorders(XWPFTable table, String hexColor) {
        CTTblPr tblPr = table.getCTTbl().getTblPr();
        if (tblPr == null) tblPr = table.getCTTbl().addNewTblPr();
        CTTblBorders borders = tblPr.isSetTblBorders() ? tblPr.getTblBorders() : tblPr.addNewTblBorders();
        for (CTBorder b : List.of(
                borders.addNewTop(), borders.addNewBottom(),
                borders.addNewLeft(), borders.addNewRight(),
                borders.addNewInsideH(), borders.addNewInsideV())) {
            b.setVal(STBorder.SINGLE);
            b.setSz(BigInteger.valueOf(4));
            b.setColor(hexColor);
        }
    }

    private CabinetProfile loadCabinetProfile() {
        try {
            return cabinetProfileRepository.findAll().stream().findFirst().orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    private byte[] toBytes(XWPFDocument doc) throws Exception {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            doc.write(out);
            return out.toByteArray();
        }
    }

    private static void appendPart(StringBuilder sb, String part) {
        if (part != null && !part.isBlank()) {
            if (!sb.isEmpty()) sb.append("  •  ");
            sb.append(part.trim());
        }
    }

    private static String joinSpace(String a, String b) {
        String s = ((a != null ? a.trim() : "") + " " + (b != null ? b.trim() : "")).trim();
        return s.isBlank() ? null : s;
    }

    private static String sanitizeFilename(String raw) {
        return raw.replaceAll("[^a-zA-Z0-9._-]", "_").replaceAll("_+", "_");
    }
}
