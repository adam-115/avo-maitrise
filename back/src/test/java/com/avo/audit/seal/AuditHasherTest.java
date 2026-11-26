package com.avo.audit.seal;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AuditHasherTest {

    private static final String KEY = "une-cle-secrete-de-test-de-32-caracteres!!";

    @Test
    void hmac_is_deterministic_and_depends_on_key_previous_hash_and_content() {
        AuditHasher hasher = new AuditHasher(KEY);
        assertThat(hasher.currentAlgorithm()).isEqualTo(AuditHasher.HMAC);

        String h = hasher.hash(AuditHasher.HMAC, AuditHasher.GENESIS, "contenu");
        assertThat(h).hasSize(64).isEqualTo(hasher.hash(AuditHasher.HMAC, AuditHasher.GENESIS, "contenu"));

        assertThat(hasher.hash(AuditHasher.HMAC, AuditHasher.GENESIS, "contenu modifié")).isNotEqualTo(h);
        assertThat(hasher.hash(AuditHasher.HMAC, h, "contenu")).isNotEqualTo(h);
        assertThat(new AuditHasher(KEY + "x").hash(AuditHasher.HMAC, AuditHasher.GENESIS, "contenu")).isNotEqualTo(h);
    }

    @Test
    void without_key_falls_back_to_plain_sha256_and_cannot_verify_hmac() {
        AuditHasher hasher = new AuditHasher("");
        assertThat(hasher.keyConfigured()).isFalse();
        assertThat(hasher.currentAlgorithm()).isEqualTo(AuditHasher.PLAIN);
        // SHA-256 de "0...0\ncontenu" : stable, indépendant de toute clé
        assertThat(hasher.hash(AuditHasher.PLAIN, AuditHasher.GENESIS, "contenu"))
                .isEqualTo(new AuditHasher(KEY).hash(AuditHasher.PLAIN, AuditHasher.GENESIS, "contenu"));
        assertThatThrownBy(() -> hasher.hash(AuditHasher.HMAC, AuditHasher.GENESIS, "contenu"))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void canonical_values_are_stable() {
        assertThat(AuditCanonicalizer.normalize(null)).isEqualTo("∅");
        assertThat(AuditCanonicalizer.normalize(Boolean.TRUE)).isEqualTo("1");
        assertThat(AuditCanonicalizer.normalize(new byte[]{1})).isEqualTo("01");
        assertThat(AuditCanonicalizer.normalize(new BigDecimal("17.00"))).isEqualTo("17.00");
        assertThat(AuditCanonicalizer.normalize(Timestamp.valueOf(LocalDateTime.of(2026, 3, 12, 9, 14, 5, 123_000_000))))
                .isEqualTo("2026-03-12T09:14:05.123");
    }
}
