package com.avo.audit.seal;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** Résultat d'une vérification d'intégrité du journal d'audit. */
public class AuditIntegrityReport {

    public enum Status { INTACT, ANOMALIES }

    /** Une anomalie détectée, compréhensible par un non-technicien. */
    public record Anomaly(String type, String chain, Long itemId, Long seq, String description) {}

    /** État d'une chaîne : nombre d'éléments vérifiés et dernière empreinte (à conserver hors de l'application). */
    public record ChainSummary(String chain, long sealedItems, long pendingItems, Long lastSeq, String lastHash) {}

    private static final int MAX_ANOMALIES = 200;

    private final LocalDateTime verifiedAt = LocalDateTime.now();
    private final List<ChainSummary> chains = new ArrayList<>();
    private final List<Anomaly> anomalies = new ArrayList<>();
    private long anomalyCount;
    private boolean keyConfigured;
    private String currentAlgorithm;
    private int protectedTables;
    private int unprotectedTables;

    void addAnomaly(String type, SealChain chain, Long itemId, Long seq, String description) {
        anomalyCount++;
        if (anomalies.size() < MAX_ANOMALIES) {
            anomalies.add(new Anomaly(type, chain == null ? null : chain.name(), itemId, seq, description));
        }
    }

    void addChain(ChainSummary summary) { chains.add(summary); }
    void setKeyConfigured(boolean keyConfigured) { this.keyConfigured = keyConfigured; }
    void setCurrentAlgorithm(String currentAlgorithm) { this.currentAlgorithm = currentAlgorithm; }
    void setProtectedTables(int protectedTables) { this.protectedTables = protectedTables; }
    void setUnprotectedTables(int unprotectedTables) { this.unprotectedTables = unprotectedTables; }

    public Status getStatus() { return anomalyCount == 0 ? Status.INTACT : Status.ANOMALIES; }
    public LocalDateTime getVerifiedAt() { return verifiedAt; }
    public List<ChainSummary> getChains() { return chains; }
    public List<Anomaly> getAnomalies() { return anomalies; }
    public long getAnomalyCount() { return anomalyCount; }
    public boolean isKeyConfigured() { return keyConfigured; }
    public String getCurrentAlgorithm() { return currentAlgorithm; }
    public int getProtectedTables() { return protectedTables; }
    public int getUnprotectedTables() { return unprotectedTables; }
}
