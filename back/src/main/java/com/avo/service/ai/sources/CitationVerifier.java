package com.avo.service.ai.sources;

import com.avo.service.ai.sources.VerificationReport.CheckedReference;
import com.avo.service.ai.sources.VerificationReport.Issue;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Vérifie une réponse de l'IA contre les sources qu'elle a réellement consultées. Aucune IA n'intervient :
 * le même texte donne toujours le même verdict.
 *
 * 1. Citations [S#] : chaque identifiant doit correspondre à une source consultée.
 * 2. Références juridiques (pourvoi, article, ECLI, décision datée) : elles doivent figurer dans une source
 *    consultée ; sinon, les numéros de pourvoi sont recherchés auprès de la Cour de cassation (Judilibre).
 * 3. Citations entre guillemets : elles doivent se retrouver mot pour mot dans une source.
 * 4. Paragraphes substantiels sans aucune source : signalés.
 */
@Component
public class CitationVerifier {

    public static final String SEVERE = "BLOQUANT";
    public static final String NOTICE = "A_NOTER";

    /** [S1], [S1, S3], [S2][S4] */
    private static final Pattern CITATION_GROUP = Pattern.compile("\\[(S\\d+(?:\\s*[,;]\\s*S\\d+)*)\\]");
    private static final Pattern CITATION_ID = Pattern.compile("S\\d+");
    private static final Pattern QUOTE = Pattern.compile("[«“\"]\\s*([^«»“”\"]{25,600}?)\\s*[»”\"]");
    private static final int MIN_PARAGRAPH = 160;

    private static final Map<String, String> LABELS = Map.of(
            "VERIFIEE", "Réponse vérifiée : toutes les affirmations sont sourcées",
            "PARTIELLE", "Réponse partiellement sourcée : certains passages ne citent pas de source",
            "A_CONTROLER", "À contrôler : au moins une référence n'a pas pu être vérifiée",
            "NON_SOURCEE", "Réponse non sourcée : l'IA n'a cité aucune des sources consultées",
            "SANS_SOURCE", "Aucune source consultée pour cette réponse");

    private final OfficialReferenceChecker officialChecker;

    public CitationVerifier(OfficialReferenceChecker officialChecker) {
        this.officialChecker = officialChecker;
    }

    public VerificationReport verify(String answer, List<SourceRef> sources) {
        String text = answer == null ? "" : answer;
        Map<String, SourceRef> byId = sources.stream()
                .collect(Collectors.toMap(SourceRef::id, s -> s, (a, b) -> a, LinkedHashMap::new));
        List<Issue> issues = new ArrayList<>();

        // 1. Citations
        LinkedHashSet<String> cited = new LinkedHashSet<>();
        Matcher group = CITATION_GROUP.matcher(text);
        while (group.find()) {
            Matcher id = CITATION_ID.matcher(group.group(1));
            while (id.find()) {
                if (byId.containsKey(id.group())) {
                    cited.add(id.group());
                } else {
                    issues.add(new Issue("CITATION_INCONNUE", SEVERE, "[" + id.group() + "]",
                            "La réponse cite la source " + id.group() + ", que l'IA n'a jamais consultée."));
                }
            }
        }

        // Clés juridiques présentes dans chaque source (texte + fiche de la décision)
        Map<String, Set<String>> keysBySource = new LinkedHashMap<>();
        for (SourceRef s : sources) {
            StringBuilder all = new StringBuilder(s.text() == null ? "" : s.text());
            s.details().values().forEach(v -> all.append(' ').append(v));
            all.append(' ').append(s.title());
            keysBySource.put(s.id(), LegalReferences.keysIn(all.toString()));
        }

        // 2. Références juridiques
        List<CheckedReference> references = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (LegalReferences.Found ref : LegalReferences.find(stripCitations(text))) {
            if (!seen.add(ref.kind() + ":" + ref.key())) {
                continue;
            }
            references.add(checkReference(ref, keysBySource, cited, issues));
        }

        // 3. Citations entre guillemets
        String allSources = sources.stream().map(s -> LegalReferences.normalize(s.text()))
                .collect(Collectors.joining(" | "));
        Matcher quote = QUOTE.matcher(text);
        while (quote.find()) {
            String quoted = LegalReferences.normalize(stripCitations(quote.group(1)));
            if (quoted.split(" ").length >= 5 && !allSources.contains(quoted)) {
                issues.add(new Issue("CITATION_NON_RETROUVEE", SEVERE, quote.group(),
                        "Ce passage est présenté comme une citation mais ne figure mot pour mot dans aucune source."));
            }
        }

        // 4. Paragraphes substantiels sans source
        boolean hasDocumentSources = sources.stream().anyMatch(s -> !SourceRef.DONNEE.equals(s.kind()));
        if (hasDocumentSources) {
            for (String paragraph : text.split("\\n\\s*\\n|\\n(?=\\s*[-*•]|\\s*\\d+[.)])")) {
                String p = paragraph.strip();
                if (p.length() >= MIN_PARAGRAPH && !CITATION_GROUP.matcher(p).find() && !p.endsWith("?")
                        && !p.startsWith("#")) {
                    issues.add(new Issue("NON_SOURCE", NOTICE, p.length() > 120 ? p.substring(0, 120) + "…" : p,
                            "Ce passage ne cite aucune source : à considérer comme une opinion de l'IA."));
                }
            }
        }

        String status = status(sources, cited, references, issues);
        return new VerificationReport(status, LABELS.get(status), List.copyOf(cited), references, issues,
                officialChecker.isEnabled());
    }

    private CheckedReference checkReference(LegalReferences.Found ref, Map<String, Set<String>> keysBySource,
            Set<String> cited, List<Issue> issues) {
        String key = ref.kind() + ":" + ref.key();
        // On privilégie une source effectivement citée, puis n'importe quelle source consultée
        String sourceId = keysBySource.entrySet().stream()
                .filter(e -> e.getValue().contains(key))
                .map(Map.Entry::getKey)
                .sorted(Comparator.comparing(id -> cited.contains(id) ? 0 : 1))
                .findFirst().orElse(null);

        String officialUrl = null;
        if (LegalReferences.ARTICLE.equals(ref.kind())) {
            officialUrl = officialChecker.legifranceSearchUrl("article " + ref.key()).orElse(null);
        }
        if (sourceId != null) {
            if (LegalReferences.POURVOI.equals(ref.kind())) {
                OfficialReferenceChecker.Result official = officialChecker.checkPourvoi(ref.key());
                if (official.outcome() == OfficialReferenceChecker.Outcome.FOUND) {
                    officialUrl = official.decision().url();
                }
            }
            return new CheckedReference(ref.kind(), ref.text(), ref.key(), "TROUVEE_DANS_SOURCE", sourceId,
                    officialUrl, "Référence présente dans la source " + sourceId + ".");
        }

        if (LegalReferences.POURVOI.equals(ref.kind())) {
            OfficialReferenceChecker.Result official = officialChecker.checkPourvoi(ref.key());
            switch (official.outcome()) {
                case FOUND -> {
                    issues.add(new Issue("REFERENCE_HORS_SOURCES", NOTICE, ref.text(),
                            "Cet arrêt existe (Cour de cassation), mais il ne figure pas dans les documents consultés : "
                                    + "vérifiez qu'il dit bien ce que l'IA lui attribue."));
                    return new CheckedReference(ref.kind(), ref.text(), ref.key(), "VERIFIEE_OFFICIELLE", null,
                            official.decision().url(), "Décision confirmée par Judilibre (Cour de cassation).");
                }
                case NOT_FOUND -> {
                    issues.add(new Issue("REFERENCE_INTROUVABLE", SEVERE, ref.text(),
                            "Aucune décision portant ce numéro n'a été trouvée, ni dans les documents du cabinet, "
                                    + "ni dans Judilibre (Cour de cassation). Référence probablement inventée."));
                    return new CheckedReference(ref.kind(), ref.text(), ref.key(), "INTROUVABLE", null, null,
                            "Introuvable dans les sources et dans Judilibre.");
                }
                default -> { /* vérification officielle impossible : traité comme non vérifié ci-dessous */ }
            }
        }

        issues.add(new Issue("REFERENCE_NON_VERIFIEE", SEVERE, ref.text(),
                "Cette référence ne figure dans aucun document consulté par l'IA. À contrôler avant toute utilisation."));
        return new CheckedReference(ref.kind(), ref.text(), ref.key(), "NON_VERIFIEE", null, officialUrl,
                "Absente des documents consultés.");
    }

    private static String status(List<SourceRef> sources, Set<String> cited, List<CheckedReference> references,
            List<Issue> issues) {
        if (issues.stream().anyMatch(i -> SEVERE.equals(i.severity()))) {
            return "A_CONTROLER";
        }
        if (sources.isEmpty()) {
            return references.isEmpty() ? "SANS_SOURCE" : "A_CONTROLER";
        }
        if (cited.isEmpty()) {
            return "NON_SOURCEE";
        }
        if (issues.stream().anyMatch(i -> "NON_SOURCE".equals(i.type()))) {
            return "PARTIELLE";
        }
        return "VERIFIEE";
    }

    private static String stripCitations(String text) {
        return CITATION_GROUP.matcher(text).replaceAll(" ");
    }
}
