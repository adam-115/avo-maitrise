package com.avo.service.ai.sources;

import java.text.Normalizer;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Repérage et normalisation des références juridiques dans un texte français : numéros de pourvoi,
 * articles de loi, identifiants ECLI et décisions datées. Purement déterministe (aucune IA).
 */
public final class LegalReferences {

    private LegalReferences() {}

    public static final String POURVOI = "POURVOI";
    public static final String ARTICLE = "ARTICLE";
    public static final String ECLI = "ECLI";
    public static final String DECISION = "DECISION";

    /** Une référence trouvée : le texte exact (pour le surligner) et sa clé normalisée (pour la comparer). */
    public record Found(String kind, String text, String key, int start, int end) {}

    /** n° 17-28.123 (format des pourvois de la Cour de cassation). */
    private static final Pattern POURVOI_RE = Pattern.compile("(?<!\\d)(\\d{2})\\s?-\\s?(\\d{2})\\s?\\.\\s?(\\d{3})(?!\\d)");

    /** article L. 145-9, art. 1240, articles R.123-4... (on garde le premier numéro). */
    private static final Pattern ARTICLE_RE = Pattern.compile(
            "(?iu)\\b(art(?:icle)?s?\\.?)\\s+((?:[LRDA]\\s?\\.?\\s?)?\\d{1,5}(?:\\s?[-–]\\s?\\d{1,5}){0,3})\\b");

    private static final Pattern ECLI_RE = Pattern.compile("\\bECLI:[A-Z]{2}:[A-Z0-9]{2,10}:\\d{4}:[A-Za-z0-9.]+\\b");

    private static final String MONTHS = "janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[ée]cembre";
    private static final Pattern DATE_WORDS_RE = Pattern.compile("(?iu)\\b(1er|\\d{1,2})\\s+(" + MONTHS + ")\\s+(\\d{4})\\b");
    private static final Pattern DATE_NUM_RE = Pattern.compile("\\b(\\d{1,2})[/.](\\d{1,2})[/.](\\d{4})\\b");
    private static final Pattern DATE_ISO_RE = Pattern.compile("\\b(\\d{4})-(\\d{2})-(\\d{2})\\b");

    /** Juridiction suivie (à moins de 80 caractères) d'une date : « Cass. com., 12 mars 2019 ». */
    private static final Pattern DECISION_RE = Pattern.compile(
            "(?iu)\\b(arr[êe]ts?|d[ée]cisions?|jugements?|ordonnances?|Cass(?:ation)?\\.?|Cour de cassation|C\\.\\s?cass\\.?|CA\\b|Cour d['’]appel|CE\\b|Conseil d['’][ÉE]tat|CJUE|CEDH|Cons\\.\\s?const\\.?|Conseil constitutionnel|TJ\\b|Tribunal)"
                    + "[^\\n;]{0,80}?\\b((?:1er|\\d{1,2})\\s+(?:" + MONTHS + ")\\s+\\d{4})");

    private static final Map<String, String> MONTH_NUM = Map.ofEntries(
            Map.entry("janvier", "01"), Map.entry("fevrier", "02"), Map.entry("mars", "03"), Map.entry("avril", "04"),
            Map.entry("mai", "05"), Map.entry("juin", "06"), Map.entry("juillet", "07"), Map.entry("aout", "08"),
            Map.entry("septembre", "09"), Map.entry("octobre", "10"), Map.entry("novembre", "11"), Map.entry("decembre", "12"));

    /** Toutes les références d'un texte, sans doublon de position. */
    public static List<Found> find(String text) {
        List<Found> found = new ArrayList<>();
        if (text == null || text.isBlank()) {
            return found;
        }
        Matcher m = POURVOI_RE.matcher(text);
        while (m.find()) {
            found.add(new Found(POURVOI, m.group(), pourvoiKey(m.group(1), m.group(2), m.group(3)), m.start(), m.end()));
        }
        m = ECLI_RE.matcher(text);
        while (m.find()) {
            found.add(new Found(ECLI, m.group(), m.group().toUpperCase(Locale.ROOT), m.start(), m.end()));
        }
        m = ARTICLE_RE.matcher(text);
        while (m.find()) {
            found.add(new Found(ARTICLE, m.group(), articleKey(m.group(2)), m.start(), m.end()));
        }
        m = DECISION_RE.matcher(text);
        while (m.find()) {
            String date = dateKey(m.group(2));
            if (date != null) {
                found.add(new Found(DECISION, m.group(), date, m.start(), m.end()));
            }
        }
        found.sort(Comparator.comparingInt(Found::start));
        return found;
    }

    /** Clés présentes dans un texte source : pourvois, articles, ECLI et toutes les dates (quel que soit le format). */
    public static Set<String> keysIn(String text) {
        Set<String> keys = new HashSet<>();
        if (text == null) {
            return keys;
        }
        for (Found f : find(text)) {
            keys.add(f.kind() + ":" + f.key());
        }
        Matcher m = DATE_WORDS_RE.matcher(text);
        while (m.find()) {
            String key = dateKey(m.group());
            if (key != null) keys.add(DECISION + ":" + key);
        }
        m = DATE_NUM_RE.matcher(text);
        while (m.find()) {
            keys.add(DECISION + ":" + m.group(3) + "-" + pad(m.group(2)) + "-" + pad(m.group(1)));
        }
        m = DATE_ISO_RE.matcher(text);
        while (m.find()) {
            keys.add(DECISION + ":" + m.group());
        }
        return keys;
    }

    public static String pourvoiKey(String a, String b, String c) {
        return a + "-" + b + "." + c;
    }

    /** « L. 145-9 » → « L145-9 » ; « 1240 » → « 1240 ». */
    public static String articleKey(String raw) {
        return raw.toUpperCase(Locale.ROOT).replaceAll("[\\s.]", "").replace('–', '-');
    }

    /** « 12 mars 2019 » → « 2019-03-12 ». */
    public static String dateKey(String raw) {
        Matcher m = DATE_WORDS_RE.matcher(raw);
        if (!m.find()) {
            return null;
        }
        String day = m.group(1).equalsIgnoreCase("1er") ? "1" : m.group(1);
        String month = MONTH_NUM.get(stripAccents(m.group(2).toLowerCase(Locale.ROOT)));
        return month == null ? null : m.group(3) + "-" + month + "-" + pad(day);
    }

    /** Texte comparable : minuscules, sans accents ni ponctuation, espaces simplifiés. */
    public static String normalize(String text) {
        if (text == null) {
            return "";
        }
        return stripAccents(text.toLowerCase(Locale.ROOT))
                .replaceAll("[’'`]", " ")
                .replaceAll("[^a-z0-9]+", " ")
                .trim();
    }

    public static String stripAccents(String s) {
        return Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
    }

    private static String pad(String n) {
        return n.length() == 1 ? "0" + n : n;
    }
}
