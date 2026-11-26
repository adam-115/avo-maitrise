package com.avo.audit.seal;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Vérifie l'intégrité du journal d'audit :
 * <ul>
 *   <li>chaque sceau est recalculé à partir du contenu actuel : une valeur modifiée en base est détectée ;</li>
 *   <li>chaque sceau doit pointer vers le précédent : une ligne de sceau supprimée ou réordonnée est détectée ;</li>
 *   <li>un élément scellé introuvable signale une suppression ;</li>
 *   <li>un élément ancien jamais scellé signale une insertion a posteriori ou un scellement arrêté ;</li>
 *   <li>les triggers « ajout seul » doivent être présents sur toutes les tables d'audit.</li>
 * </ul>
 */
@Service
public class AuditIntegrityService {

    private static final List<String> CORE_TABLES = List.of("audit_log", "audit_revision", "audit_log_seal", "audit_revision_seal");

    private final JdbcTemplate jdbc;
    private final AuditCanonicalizer canonicalizer;
    private final AuditHasher hasher;
    private final AuditSealService sealService;
    private final int batchSize;
    private final int graceMinutes;

    public AuditIntegrityService(JdbcTemplate jdbc, AuditCanonicalizer canonicalizer, AuditHasher hasher,
            AuditSealService sealService,
            @Value("${audit.seal.batch-size:200}") int batchSize,
            @Value("${audit.seal.unsealed-grace-minutes:10}") int graceMinutes) {
        this.jdbc = jdbc;
        this.canonicalizer = canonicalizer;
        this.hasher = hasher;
        this.sealService = sealService;
        this.batchSize = batchSize;
        this.graceMinutes = graceMinutes;
    }

    public AuditIntegrityReport verify() {
        AuditIntegrityReport report = new AuditIntegrityReport();
        report.setKeyConfigured(hasher.keyConfigured());
        report.setCurrentAlgorithm(hasher.currentAlgorithm());
        for (SealChain chain : SealChain.values()) {
            verifyChain(chain, report);
        }
        verifyTriggers(report);
        return report;
    }

    private void verifyChain(SealChain chain, AuditIntegrityReport report) {
        String expectedPrevious = AuditHasher.GENESIS;
        long lastSeq = 0;
        long sealedItems = 0;
        boolean missingKeyReported = false;

        while (true) {
            // Date affichée par l'élément, pour mesurer en Java (sans dépendre du fuseau MySQL) le délai de scellement
            String sourceTime = chain == SealChain.CONSULTATIONS ? "src.event_time" : "src.revision_timestamp";
            List<Map<String, Object>> seals = jdbc.queryForList(
                    "select s.seq, s." + chain.itemColumn + " as item_id, s.prev_hash, s.hash, s.algorithm, s.sealed_at, "
                            + sourceTime + " as source_time from " + chain.sealTable + " s left join " + chain.sourceTable
                            + " src on src.id = s." + chain.itemColumn + " where s.seq > ? order by s.seq limit ?",
                    lastSeq, batchSize);
            if (seals.isEmpty()) {
                break;
            }
            List<Long> itemIds = seals.stream().map(s -> ((Number) s.get("item_id")).longValue()).toList();
            Map<Long, String> contents = chain == SealChain.CONSULTATIONS
                    ? canonicalizer.logContents(itemIds)
                    : canonicalizer.revisionContents(itemIds);

            for (Map<String, Object> seal : seals) {
                long seq = ((Number) seal.get("seq")).longValue();
                long itemId = ((Number) seal.get("item_id")).longValue();
                String previous = (String) seal.get("prev_hash");
                String stored = (String) seal.get("hash");
                String algorithm = (String) seal.get("algorithm");
                sealedItems++;

                if (!expectedPrevious.equals(previous)) {
                    report.addAnomaly("CHAINE_ROMPUE", chain, itemId, seq,
                            "Le sceau ne suit pas le sceau précédent : un sceau a été supprimé, inséré ou déplacé juste avant.");
                }
                String content = contents.get(itemId);
                if (content == null) {
                    report.addAnomaly("ELEMENT_SUPPRIME", chain, itemId, seq,
                            "Élément scellé introuvable : il a été supprimé de la base après son scellement.");
                } else if (AuditHasher.HMAC.equals(algorithm) && !hasher.keyConfigured()) {
                    if (!missingKeyReported) {
                        report.addAnomaly("VERIFICATION_IMPOSSIBLE", chain, null, seq,
                                "Sceaux HMAC présents mais clé AUDIT_SEAL_KEY absente : impossible de les vérifier.");
                        missingKeyReported = true;
                    }
                } else if (!hasher.hash(algorithm, previous, content).equals(stored)) {
                    report.addAnomaly("ELEMENT_MODIFIE", chain, itemId, seq,
                            "Le contenu ne correspond plus à son sceau : il a été modifié après son scellement.");
                }
                Long delaySeconds = sealDelaySeconds(seal.get("source_time"), seal.get("sealed_at"));
                if (delaySeconds != null && delaySeconds > graceMinutes * 60L + sealService.getMarginSeconds()) {
                    report.addAnomaly("SCELLEMENT_TARDIF", chain, itemId, seq, "Scellé " + (delaySeconds / 60)
                            + " min après la date qu'il affiche : élément inséré a posteriori avec une date antérieure, "
                            + "ou application arrêtée entre-temps. À examiner.");
                }
                expectedPrevious = stored;
                lastSeq = seq;
            }
        }

        long pending = countUnsealed(chain, 0);
        long overdue = countUnsealed(chain, graceMinutes * 60 + sealService.getMarginSeconds());
        if (overdue > 0) {
            report.addAnomaly("NON_SCELLE", chain, null, null, overdue
                    + " élément(s) de plus de " + graceMinutes + " min jamais scellé(s) : insertion a posteriori, "
                    + "suppression de sceaux en fin de chaîne, ou scellement arrêté.");
        }
        report.addChain(new AuditIntegrityReport.ChainSummary(chain.name(), sealedItems, pending,
                lastSeq == 0 ? null : lastSeq, lastSeq == 0 ? null : expectedPrevious));
    }

    /** Délai (s) entre la date affichée par l'élément (Timestamp ou epoch en ms) et son scellement. */
    static Long sealDelaySeconds(Object sourceTime, Object sealedAt) {
        Long sourceMillis = toMillis(sourceTime);
        Long sealedMillis = toMillis(sealedAt);
        return (sourceMillis == null || sealedMillis == null) ? null : (sealedMillis - sourceMillis) / 1000;
    }

    private static Long toMillis(Object value) {
        if (value instanceof Timestamp ts) {
            return ts.getTime();
        }
        if (value instanceof LocalDateTime ldt) {
            return Timestamp.valueOf(ldt).getTime();
        }
        if (value instanceof Number n) {
            return n.longValue();
        }
        return null;
    }

    private long countUnsealed(SealChain chain, int olderThanSeconds) {
        String sql = chain.pendingQuery.replace(" order by l.id limit ?", "").replace(" order by r.id limit ?", "")
                .replaceFirst("select [lr]\\.id from", "select count(*) from");
        Object cutoff = chain == SealChain.CONSULTATIONS
                ? Timestamp.valueOf(LocalDateTime.now().minusSeconds(olderThanSeconds))
                : System.currentTimeMillis() - olderThanSeconds * 1000L;
        Long count = jdbc.queryForObject(sql, Long.class, cutoff);
        return count == null ? 0 : count;
    }

    private void verifyTriggers(AuditIntegrityReport report) {
        List<String> tables = new ArrayList<>(CORE_TABLES);
        tables.addAll(canonicalizer.auditTables());

        Map<String, Set<String>> protections = new HashMap<>();
        jdbc.query("select event_object_table, event_manipulation from information_schema.triggers "
                        + "where trigger_schema = database() and action_timing = 'BEFORE' "
                        + "and event_manipulation in ('UPDATE', 'DELETE') and action_statement like '%45000%'",
                rs -> {
                    protections.computeIfAbsent(rs.getString(1).toLowerCase(Locale.ROOT), k -> new HashSet<>())
                            .add(rs.getString(2));
                });

        int ok = 0;
        int ko = 0;
        for (String table : tables) {
            Set<String> events = protections.getOrDefault(table, Set.of());
            if (events.containsAll(Set.of("UPDATE", "DELETE"))) {
                ok++;
            } else {
                ko++;
                report.addAnomaly("PROTECTION_DESACTIVEE", null, null, null,
                        "La table " + table + " n'est plus protégée contre la modification ou la suppression (trigger absent).");
            }
        }
        report.setProtectedTables(ok);
        report.setUnprotectedTables(ko);
    }
}
