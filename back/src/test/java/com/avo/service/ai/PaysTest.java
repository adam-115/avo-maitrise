package com.avo.service.ai;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PaysTest {

    @Test
    void known_countries_are_normalized_whatever_their_spelling() {
        assertThat(Pays.normalizeOrNull("France")).isEqualTo("FRANCE");
        assertThat(Pays.normalizeOrNull(" lu ")).isEqualTo("LUXEMBOURG");
        assertThat(Pays.normalizeOrNull("Belgium")).isEqualTo("BELGIQUE");
        assertThat(Pays.normalizeOrNull("Deutschland")).isEqualTo("ALLEMAGNE");
        assertThat(Pays.normalizeOrNull("suisse")).isEqualTo("SUISSE");
    }

    @Test
    void unknown_country_is_never_silently_turned_into_france_for_a_dossier() {
        assertThat(Pays.normalizeOrNull("Maroc")).isNull();
        assertThat(Pays.normalizeOrNull("")).isNull();
        assertThat(Pays.normalizeOrNull(null)).isNull();
        // normalize() garde son comportement historique (France par défaut) pour les autres usages
        assertThat(Pays.normalize("Maroc")).isEqualTo("FRANCE");
    }

    @Test
    void legal_scope_always_includes_international_law() {
        assertThat(Pays.perimetre("LUXEMBOURG")).containsExactly("LUXEMBOURG", "INTERNATIONAL");
        assertThat(Pays.perimetre("INTERNATIONAL")).containsExactly("INTERNATIONAL");
        assertThat(Pays.perimetre("n'importe quoi")).containsExactly("FRANCE", "INTERNATIONAL");
    }
}
