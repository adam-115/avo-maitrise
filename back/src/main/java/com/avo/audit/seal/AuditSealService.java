package com.avo.audit.seal;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Scelle périodiquement les nouvelles lignes du journal : chaque élément reçoit une empreinte qui dépend
 * de son contenu ET de l'empreinte précédente. Modifier, supprimer ou insérer une ligne a posteriori
 * casse la chaîne, ce que détecte {@link AuditIntegrityService}.
 *
 * Le scellement est différé d'une marge de sécurité (30 s par défaut) pour ne sceller que des données
 * dont la transaction est terminée. Une seule instance de l'application doit tourner (cas du VPS).
 */
@Service
public class AuditSealService {

    private static final Logger log = LoggerFactory.getLogger(AuditSealService.class);

    private final JdbcTemplate jdbc;
    private final TransactionTemplate tx;
    private final AuditCanonicalizer canonicalizer;
    private final AuditHasher hasher;
    private final boolean enabled;
    private final int marginSeconds;
    private final int batchSize;

    public AuditSealService(JdbcTemplate jdbc, TransactionTemplate tx, AuditCanonicalizer canonicalizer,
            AuditHasher hasher,
            @Value("${audit.seal.enabled:true}") boolean enabled,
            @Value("${audit.seal.margin-seconds:30}") int marginSeconds,
            @Value("${audit.seal.batch-size:200}") int batchSize) {
        this.jdbc = jdbc;
        this.tx = tx;
        this.canonicalizer = canonicalizer;
        this.hasher = hasher;
        this.enabled = enabled;
        this.marginSeconds = marginSeconds;
        this.batchSize = batchSize;
    }

    @Scheduled(fixedDelayString = "${audit.seal.delay-ms:60000}", initialDelayString = "${audit.seal.initial-delay-ms:30000}")
    public void scheduledSeal() {
        if (!enabled) {
            return;
        }
        try {
            int sealed = sealPending();
            if (sealed > 0) {
                log.debug("Journal d'audit : {} élément(s) scellé(s)", sealed);
            }
        } catch (Exception e) {
            log.error("Échec du scellement du journal d'audit : {}", e.getMessage(), e);
        }
    }

    /** Scelle tout ce qui est en attente (au-delà de la marge de sécurité). Retourne le nombre d'éléments scellés. */
    public synchronized int sealPending() {
        return seal(SealChain.CONSULTATIONS) + seal(SealChain.MODIFICATIONS);
    }

    public int getMarginSeconds() {
        return marginSeconds;
    }

    private int seal(SealChain chain) {
        int total = 0;
        while (true) {
            Integer sealed = tx.execute(status -> sealBatch(chain));
            if (sealed == null || sealed == 0) {
                return total;
            }
            total += sealed;
        }
    }

    private int sealBatch(SealChain chain) {
        Object cutoff = chain == SealChain.CONSULTATIONS
                ? Timestamp.valueOf(LocalDateTime.now().minusSeconds(marginSeconds))
                : System.currentTimeMillis() - marginSeconds * 1000L;
        List<Long> ids = jdbc.queryForList(chain.pendingQuery, Long.class, cutoff, batchSize);
        if (ids.isEmpty()) {
            return 0;
        }
        Map<Long, String> contents = chain == SealChain.CONSULTATIONS
                ? canonicalizer.logContents(ids)
                : canonicalizer.revisionContents(ids);

        String previous = lastHash(chain);
        String algorithm = hasher.currentAlgorithm();
        Timestamp now = Timestamp.valueOf(LocalDateTime.now());
        int sealed = 0;
        for (Long id : ids) {
            String content = contents.get(id);
            if (content == null) {
                continue;
            }
            String hash = hasher.hash(algorithm, previous, content);
            jdbc.update("insert into " + chain.sealTable + " (" + chain.itemColumn
                    + ", prev_hash, hash, algorithm, sealed_at) values (?, ?, ?, ?, ?)",
                    id, previous, hash, algorithm, now);
            previous = hash;
            sealed++;
        }
        return sealed;
    }

    String lastHash(SealChain chain) {
        List<String> last = jdbc.queryForList(
                "select hash from " + chain.sealTable + " order by seq desc limit 1", String.class);
        return last.isEmpty() ? AuditHasher.GENESIS : last.get(0);
    }
}
