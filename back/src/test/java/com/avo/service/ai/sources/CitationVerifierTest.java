package com.avo.service.ai.sources;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class CitationVerifierTest {

    /** Vérification officielle désactivée (pas de clé Judilibre). */
    private static final OfficialReferenceChecker OFFLINE = new OfficialReferenceChecker() {
        public boolean isEnabled() { return false; }
        public Result checkPourvoi(String key) { return Result.unavailable(); }
    };

    private static OfficialReferenceChecker judilibre(Map<String, OfficialReferenceChecker.OfficialDecision> known) {
        return new OfficialReferenceChecker() {
            public boolean isEnabled() { return true; }
            public Result checkPourvoi(String key) {
                OfficialReferenceChecker.OfficialDecision d = known.get(key);
                return d == null ? Result.notFound() : Result.found(d);
            }
        };
    }

    private static SourceRef source(String id, String kind, String text) {
        return new SourceRef(id, kind, "doc-" + id + ".pdf", 1L, 2, text, text, null, null, Map.of());
    }

    private static final SourceRef BAIL = source("S1", SourceRef.DOCUMENT,
            "Le bail est consenti pour une durée de neuf années entières et consécutives. "
                    + "Le preneur pourra donner congé à l'expiration de chaque période triennale, conformément à l'article L.145-9 du code de commerce.");
    private static final SourceRef ARRET = source("S2", SourceRef.JURISPRUDENCE,
            "Cass. com., 12/03/2019, pourvoi n° 17-28.123 : la durée du préavis s'apprécie au regard de l'ancienneté de la relation.");

    @Test
    void fully_sourced_answer_is_verified() {
        String answer = "Le bail dure neuf ans [S1]. Le congé est possible à chaque période triennale (article L. 145-9) [S1]. "
                + "Selon Cass. com., 12 mars 2019, n° 17-28.123, le préavis dépend de l'ancienneté [S2].";
        VerificationReport r = new CitationVerifier(OFFLINE).verify(answer, List.of(BAIL, ARRET));

        assertThat(r.status()).isEqualTo("VERIFIEE");
        assertThat(r.citedSources()).containsExactly("S1", "S2");
        assertThat(r.references()).extracting(VerificationReport.CheckedReference::status)
                .containsOnly("TROUVEE_DANS_SOURCE");
        assertThat(r.references()).extracting(VerificationReport.CheckedReference::kind)
                .contains(LegalReferences.ARTICLE, LegalReferences.POURVOI, LegalReferences.DECISION);
    }

    @Test
    void invented_pourvoi_is_flagged_when_absent_from_sources() {
        String answer = "Le préavis dépend de l'ancienneté [S2]. Un arrêt n° 18-11.111 exigerait 18 mois de préavis [S2].";
        VerificationReport r = new CitationVerifier(OFFLINE).verify(answer, List.of(ARRET));

        assertThat(r.status()).isEqualTo("A_CONTROLER");
        assertThat(r.issues()).anySatisfy(i -> {
            assertThat(i.type()).isEqualTo("REFERENCE_NON_VERIFIEE");
            assertThat(i.text()).isEqualTo("18-11.111");
        });
    }

    @Test
    void judilibre_confirms_or_refutes_a_pourvoi_outside_sources() {
        var official = judilibre(Map.of("19-60.222", new OfficialReferenceChecker.OfficialDecision(
                "abc", "19-60.222", "2020-12-09", "cc", "civ2", "https://www.courdecassation.fr/decision/abc")));
        String answer = "Voir n° 19-60.222 [S2] et n° 18-11.111 [S2].";
        VerificationReport r = new CitationVerifier(official).verify(answer, List.of(ARRET));

        assertThat(r.references()).anySatisfy(ref -> {
            assertThat(ref.key()).isEqualTo("19-60.222");
            assertThat(ref.status()).isEqualTo("VERIFIEE_OFFICIELLE");
            assertThat(ref.officialUrl()).isEqualTo("https://www.courdecassation.fr/decision/abc");
        });
        assertThat(r.references()).anySatisfy(ref -> {
            assertThat(ref.key()).isEqualTo("18-11.111");
            assertThat(ref.status()).isEqualTo("INTROUVABLE");
        });
        assertThat(r.status()).isEqualTo("A_CONTROLER");
    }

    @Test
    void citation_of_a_source_never_consulted_is_flagged() {
        VerificationReport r = new CitationVerifier(OFFLINE).verify("Le bail dure neuf ans [S1, S7].", List.of(BAIL));

        assertThat(r.citedSources()).containsExactly("S1");
        assertThat(r.issues()).anySatisfy(i -> assertThat(i.type()).isEqualTo("CITATION_INCONNUE"));
        assertThat(r.status()).isEqualTo("A_CONTROLER");
    }

    @Test
    void quotes_must_appear_word_for_word_in_a_source() {
        CitationVerifier verifier = new CitationVerifier(OFFLINE);
        VerificationReport ok = verifier.verify(
                "Le contrat prévoit « une durée de neuf années entières et consécutives » [S1].", List.of(BAIL));
        VerificationReport ko = verifier.verify(
                "Le contrat prévoit « une durée de douze années renouvelables par tacite reconduction » [S1].", List.of(BAIL));

        assertThat(ok.issues()).noneMatch(i -> i.type().equals("CITATION_NON_RETROUVEE"));
        assertThat(ko.issues()).anySatisfy(i -> assertThat(i.type()).isEqualTo("CITATION_NON_RETROUVEE"));
        assertThat(ko.status()).isEqualTo("A_CONTROLER");
    }

    @Test
    void answer_citing_nothing_despite_sources_is_not_sourced() {
        VerificationReport r = new CitationVerifier(OFFLINE).verify("Le bail dure neuf ans.", List.of(BAIL));
        assertThat(r.status()).isEqualTo("NON_SOURCEE");
    }

    @Test
    void general_answer_without_sources_or_references_is_neutral() {
        VerificationReport r = new CitationVerifier(OFFLINE).verify("Bonjour, comment puis-je vous aider ?", List.of());
        assertThat(r.status()).isEqualTo("SANS_SOURCE");
        assertThat(r.issues()).isEmpty();
    }

    @Test
    void legal_reference_without_any_source_must_be_checked() {
        VerificationReport r = new CitationVerifier(OFFLINE).verify(
                "L'article 1240 du code civil s'applique.", List.of());
        assertThat(r.status()).isEqualTo("A_CONTROLER");
        assertThat(r.references()).singleElement().satisfies(ref -> {
            assertThat(ref.key()).isEqualTo("1240");
            assertThat(ref.officialUrl()).startsWith("https://www.legifrance.gouv.fr/search/all");
        });
    }

    @Test
    void long_unsourced_paragraph_makes_answer_partial() {
        String answer = "Le bail dure neuf ans [S1].\n\n"
                + "Il conviendrait par ailleurs d'envisager une négociation amiable avec le bailleur afin de préserver "
                + "la relation commerciale et d'éviter un contentieux long et coûteux devant le tribunal judiciaire compétent.";
        VerificationReport r = new CitationVerifier(OFFLINE).verify(answer, List.of(BAIL));
        assertThat(r.status()).isEqualTo("PARTIELLE");
        assertThat(r.issues()).anySatisfy(i -> assertThat(i.type()).isEqualTo("NON_SOURCE"));
    }
}
