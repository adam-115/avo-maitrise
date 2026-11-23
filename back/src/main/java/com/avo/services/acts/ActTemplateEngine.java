package com.avo.services.acts;

import com.avo.entities.CabinetProfile;
import org.apache.poi.util.Units;
import org.apache.poi.wp.usermodel.HeaderFooterType;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Moteur déterministe de détection et de fusion de variables {{variable}} pour
 * :
 * - les modèles texte (TEXT_TEMPLATE) avec export propre au format Word (.docx)
 * ;
 * - les modèles Word (.docx) uploadés par le cabinet (fusion dans paragraphes,
 * tableaux, en-têtes et pieds de page).
 */
@Service
public class ActTemplateEngine {

    private static final Pattern PLACEHOLDER = Pattern.compile("\\{\\{\\s*([a-zA-Z0-9_.]+)\\s*}}");

    /**
     * Extrait l'ensemble ordonné et unique des noms de variables {{...}} présents
     * dans un texte.
     */
    public List<String> extractPlaceholders(String templateText) {
        if (templateText == null || templateText.isBlank()) {
            return List.of();
        }
        Set<String> found = new LinkedHashSet<>();
        Matcher m = PLACEHOLDER.matcher(templateText);
        while (m.find()) {
            found.add(m.group(1));
        }
        return new ArrayList<>(found);
    }

    /** Extrait les variables {{...}} présentes dans un fichier Word (.docx). */
    public List<String> extractPlaceholdersFromDocx(byte[] docxBytes) throws IOException {
        Set<String> found = new LinkedHashSet<>();
        try (XWPFDocument doc = new XWPFDocument(new ByteArrayInputStream(docxBytes))) {
            collectFromParagraphs(doc.getParagraphs(), found);
            for (XWPFTable table : doc.getTables()) {
                for (XWPFTableRow row : table.getRows()) {
                    for (XWPFTableCell cell : row.getTableCells()) {
                        collectFromParagraphs(cell.getParagraphs(), found);
                    }
                }
            }
            for (XWPFHeader header : doc.getHeaderList()) {
                collectFromParagraphs(header.getParagraphs(), found);
            }
            for (XWPFFooter footer : doc.getFooterList()) {
                collectFromParagraphs(footer.getParagraphs(), found);
            }
        }
        return new ArrayList<>(found);
    }

    /**
     * Remplace toutes les balises {{variable}} connues ; laisse visibles celles qui
     * restent vides.
     */
    public String renderText(String templateText, Map<String, String> values) {
        if (templateText == null)
            return "";
        Map<String, String> safeValues = values != null ? values : Map.of();
        Matcher m = PLACEHOLDER.matcher(templateText);
        StringBuilder sb = new StringBuilder();
        while (m.find()) {
            String key = m.group(1);
            String val = safeValues.get(key);
            String replacement = (val != null && !val.isBlank()) ? val : ("[" + key + "]");
            m.appendReplacement(sb, Matcher.quoteReplacement(replacement));
        }
        m.appendTail(sb);
        return sb.toString();
    }

    /**
     * Identifie les variables du modèle dont la valeur est encore vide ou
     * manquante.
     */
    public List<String> findMissingVariables(List<String> placeholders, Map<String, String> values) {
        Map<String, String> safeValues = values != null ? values : Map.of();
        List<String> missing = new ArrayList<>();
        for (String key : placeholders) {
            String v = safeValues.get(key);
            if (v == null || v.isBlank()) {
                missing.add(key);
            }
        }
        return missing;
    }

    /**
     * Génère un fichier Word (.docx) proprement formaté à partir d'un texte d'acte
     * fusionné (sans en-tête cabinet).
     */
    public byte[] buildDocxFromText(String title, String mergedText) throws IOException {
        return buildDocxFromText(title, mergedText, null);
    }

    /**
     * Génère un fichier Word (.docx) avec papier à en-tête officiel du cabinet
     * (logo + coordonnées
     * en en-tête de page et mentions légales SIRET/TVA/site en pied de page)
     * lorsque {@code cabinet} est fourni.
     */
    public byte[] buildDocxFromText(String title, String mergedText, CabinetProfile cabinet) throws IOException {
        try (XWPFDocument doc = new XWPFDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            if (cabinet != null) {
                addCabinetHeaderAndFooter(doc, cabinet);
            }
            String[] lines = (mergedText == null ? "" : mergedText).split("\\r?\\n", -1);
            for (String line : lines) {
                XWPFParagraph p = doc.createParagraph();
                p.setSpacingAfter(80);
                XWPFRun run = p.createRun();
                run.setFontFamily("Calibri");
                run.setFontSize(11);
                String trimmed = line.trim();
                if (!trimmed.isEmpty() && (trimmed.equals(trimmed.toUpperCase(Locale.FRENCH)) && trimmed.length() > 4
                        || trimmed.startsWith("ARTICLE ") || trimmed.startsWith("I.") || trimmed.startsWith("II.")
                        || trimmed.startsWith("III."))) {
                    run.setBold(true);
                }
                run.setText(line);
            }
            doc.write(out);
            return out.toByteArray();
        }
    }

    private void addCabinetHeaderAndFooter(XWPFDocument doc, CabinetProfile cabinet) {
        // --- En-tête : logo à gauche + coordonnées du cabinet à droite ---
        XWPFHeader header = doc.createHeader(HeaderFooterType.DEFAULT);
        XWPFTable table = header.createTable(1, 2);
        table.removeBorders();
        table.setWidth("100%");

        XWPFTableCell logoCell = table.getRow(0).getCell(0);
        XWPFParagraph logoPara = logoCell.getParagraphs().get(0);
        logoPara.setAlignment(ParagraphAlignment.LEFT);
        if (cabinet.getLogo() != null && cabinet.getLogo().length > 0) {
            try (ByteArrayInputStream imgIn = new ByteArrayInputStream(cabinet.getLogo())) {
                int picType = detectPictureType(cabinet.getLogoContentType());
                XWPFRun imgRun = logoPara.createRun();
                imgRun.addPicture(imgIn, picType, "logo", Units.toEMU(90), Units.toEMU(45));
            } catch (Exception ignored) {
                // Si le format d'image n'est pas supporté par POI, on continue avec le texte
                // seul
            }
        }

        XWPFTableCell infoCell = table.getRow(0).getCell(1);
        XWPFParagraph infoPara = infoCell.getParagraphs().get(0);
        infoPara.setAlignment(ParagraphAlignment.RIGHT);
        infoPara.setSpacingAfter(40);

        XWPFRun nameRun = infoPara.createRun();
        nameRun.setBold(true);
        nameRun.setFontFamily("Calibri");
        nameRun.setFontSize(11);
        nameRun.setColor("1E293B");
        nameRun.setText(cabinet.getName() != null ? cabinet.getName() : "Cabinet d'Avocats");

        List<String> infoLines = new ArrayList<>();
        String addr = joinNonBlank(" ", cabinet.getAddress(), cabinet.getPostalCode(), cabinet.getCity());
        if (!addr.isBlank())
            infoLines.add(addr);
        String contact = joinNonBlank(" · ",
                notBlank(cabinet.getPhone()) ? "Tél. : " + cabinet.getPhone() : null,
                notBlank(cabinet.getEmail()) ? cabinet.getEmail() : null);
        if (!contact.isBlank())
            infoLines.add(contact);
        if (notBlank(cabinet.getWebsite()))
            infoLines.add(cabinet.getWebsite());

        for (String line : infoLines) {
            XWPFRun r = infoPara.createRun();
            r.addBreak();
            r.setFontFamily("Calibri");
            r.setFontSize(8);
            r.setColor("475569");
            r.setText(line);
        }

        XWPFParagraph sep = header.createParagraph();
        sep.setBorderBottom(Borders.SINGLE);
        sep.setSpacingAfter(120);

        // --- Pied de page : mentions légales du cabinet ---
        XWPFFooter footer = doc.createFooter(HeaderFooterType.DEFAULT);
        XWPFParagraph fp = footer.createParagraph();
        fp.setAlignment(ParagraphAlignment.CENTER);
        fp.setBorderTop(Borders.SINGLE);
        XWPFRun fr = fp.createRun();
        fr.setFontFamily("Calibri");
        fr.setFontSize(8);
        fr.setColor("64748B");
        String legalLine = joinNonBlank("  |  ",
                cabinet.getName(),
                notBlank(cabinet.getSiret()) ? "SIRET : " + cabinet.getSiret() : null,
                notBlank(cabinet.getVatNumber()) ? "TVA : " + cabinet.getVatNumber() : null,
                notBlank(cabinet.getIban()) ? "IBAN : " + cabinet.getIban() : null,
                cabinet.getWebsite());
        fr.setText(legalLine);
    }

    private static int detectPictureType(String contentType) {
        if (contentType != null && contentType.toLowerCase().contains("png")) {
            return Document.PICTURE_TYPE_PNG;
        }
        return Document.PICTURE_TYPE_JPEG;
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

    private static String joinNonBlank(String sep, String... parts) {
        List<String> nonEmpty = new ArrayList<>();
        for (String p : parts) {
            if (notBlank(p))
                nonEmpty.add(p.trim());
        }
        return String.join(sep, nonEmpty);
    }

    /**
     * Fusionne un modèle Word (.docx) existant en remplaçant les {{variables}} dans
     * tout le document.
     */
    public byte[] mergeDocxTemplate(byte[] templateDocx, Map<String, String> values) throws IOException {
        try (XWPFDocument doc = new XWPFDocument(new ByteArrayInputStream(templateDocx));
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            replaceInParagraphs(doc.getParagraphs(), values);
            for (XWPFTable table : doc.getTables()) {
                for (XWPFTableRow row : table.getRows()) {
                    for (XWPFTableCell cell : row.getTableCells()) {
                        replaceInParagraphs(cell.getParagraphs(), values);
                    }
                }
            }
            for (XWPFHeader header : doc.getHeaderList()) {
                replaceInParagraphs(header.getParagraphs(), values);
            }
            for (XWPFFooter footer : doc.getFooterList()) {
                replaceInParagraphs(footer.getParagraphs(), values);
            }
            doc.write(out);
            return out.toByteArray();
        }
    }

    private void collectFromParagraphs(List<XWPFParagraph> paragraphs, Set<String> found) {
        for (XWPFParagraph p : paragraphs) {
            found.addAll(extractPlaceholders(p.getText()));
        }
    }

    private void replaceInParagraphs(List<XWPFParagraph> paragraphs, Map<String, String> values) {
        for (XWPFParagraph p : paragraphs) {
            String text = p.getText();
            if (text == null || !text.contains("{{"))
                continue;
            String merged = renderText(text, values);
            List<XWPFRun> runs = p.getRuns();
            if (runs != null && !runs.isEmpty()) {
                // Conserve le style du premier run (police, taille, gras) et remplace le texte
                // complet
                XWPFRun first = runs.get(0);
                for (int i = runs.size() - 1; i >= 1; i--) {
                    p.removeRun(i);
                }
                String[] lines = merged.split("\\r?\\n", -1);
                first.setText(lines[0], 0);
                for (int i = 1; i < lines.length; i++) {
                    first.addBreak();
                    first.setText(lines[i]);
                }
            }
        }
    }
}
