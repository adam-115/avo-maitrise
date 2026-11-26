package com.avo.dtos.conflict;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public final class ConflictCheckDTOs {

    private ConflictCheckDTOs() {}

    public static class PartyInput {
        private Long clientId;
        private String role;
        private String name;

        public PartyInput() {}
        public PartyInput(Long clientId, String role, String name) {
            this.clientId = clientId;
            this.role = role;
            this.name = name;
        }
        public Long getClientId() { return clientId; }
        public void setClientId(Long clientId) { this.clientId = clientId; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }

    public static class CheckRequest {
        private Long dossierId;
        private Long clientId;
        private List<PartyInput> parties = new ArrayList<>();
        private List<String> freeTextQueries = new ArrayList<>();

        public Long getDossierId() { return dossierId; }
        public void setDossierId(Long dossierId) { this.dossierId = dossierId; }
        public Long getClientId() { return clientId; }
        public void setClientId(Long clientId) { this.clientId = clientId; }
        public List<PartyInput> getParties() { return parties; }
        public void setParties(List<PartyInput> parties) { this.parties = parties; }
        public List<String> getFreeTextQueries() { return freeTextQueries; }
        public void setFreeTextQueries(List<String> freeTextQueries) { this.freeTextQueries = freeTextQueries; }
    }

    public static class Match {
        private String severity; // CRITICAL, HIGH, MEDIUM
        private String matchType; // CLIENT_DIRECT, IDENTIFIANT_UNIQUE, DIRIGEANT, UBO, PARTIE_DOSSIER, HOMONYME
        private String queriedEntity;
        private String matchedEntityName;
        private Long matchedClientId;
        private Long matchedDossierId;
        private String matchedDossierReference;
        private String matchedDossierTitre;
        private String matchedRole;
        private String explanation;
        private boolean matchedClientDeleted;

        public Match() {}

        public Match(String severity, String matchType, String queriedEntity, String matchedEntityName,
                     Long matchedClientId, Long matchedDossierId, String matchedDossierReference,
                     String matchedDossierTitre, String matchedRole, String explanation) {
            this.severity = severity;
            this.matchType = matchType;
            this.queriedEntity = queriedEntity;
            this.matchedEntityName = matchedEntityName;
            this.matchedClientId = matchedClientId;
            this.matchedDossierId = matchedDossierId;
            this.matchedDossierReference = matchedDossierReference;
            this.matchedDossierTitre = matchedDossierTitre;
            this.matchedRole = matchedRole;
            this.explanation = explanation;
        }

        public String getSeverity() { return severity; }
        public void setSeverity(String severity) { this.severity = severity; }
        public String getMatchType() { return matchType; }
        public void setMatchType(String matchType) { this.matchType = matchType; }
        public String getQueriedEntity() { return queriedEntity; }
        public void setQueriedEntity(String queriedEntity) { this.queriedEntity = queriedEntity; }
        public String getMatchedEntityName() { return matchedEntityName; }
        public void setMatchedEntityName(String matchedEntityName) { this.matchedEntityName = matchedEntityName; }
        public Long getMatchedClientId() { return matchedClientId; }
        public void setMatchedClientId(Long matchedClientId) { this.matchedClientId = matchedClientId; }
        public Long getMatchedDossierId() { return matchedDossierId; }
        public void setMatchedDossierId(Long matchedDossierId) { this.matchedDossierId = matchedDossierId; }
        public String getMatchedDossierReference() { return matchedDossierReference; }
        public void setMatchedDossierReference(String matchedDossierReference) { this.matchedDossierReference = matchedDossierReference; }
        public String getMatchedDossierTitre() { return matchedDossierTitre; }
        public void setMatchedDossierTitre(String matchedDossierTitre) { this.matchedDossierTitre = matchedDossierTitre; }
        public String getMatchedRole() { return matchedRole; }
        public void setMatchedRole(String matchedRole) { this.matchedRole = matchedRole; }
        public String getExplanation() { return explanation; }
        public void setExplanation(String explanation) { this.explanation = explanation; }
        public boolean isMatchedClientDeleted() { return matchedClientDeleted; }
        public void setMatchedClientDeleted(boolean matchedClientDeleted) { this.matchedClientDeleted = matchedClientDeleted; }
    }

    public static class CheckResponse {
        private boolean hasConflict;
        private String riskLevel; // NONE, MEDIUM, HIGH, CRITICAL
        private boolean requiresJustification;
        private String searchSummary;
        private List<Match> matches = new ArrayList<>();

        public boolean isHasConflict() { return hasConflict; }
        public void setHasConflict(boolean hasConflict) { this.hasConflict = hasConflict; }
        public String getRiskLevel() { return riskLevel; }
        public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
        public boolean isRequiresJustification() { return requiresJustification; }
        public void setRequiresJustification(boolean requiresJustification) { this.requiresJustification = requiresJustification; }
        public String getSearchSummary() { return searchSummary; }
        public void setSearchSummary(String searchSummary) { this.searchSummary = searchSummary; }
        public List<Match> getMatches() { return matches; }
        public void setMatches(List<Match> matches) { this.matches = matches; }
    }

    public static class RecordRequest {
        private Long dossierId;
        private String searchSummary;
        private String riskLevel;
        private String decision; // CLEARED, PROCEEDED_WITH_WAIVER, BLOCKED
        private String justification;
        private List<Match> matches = new ArrayList<>();

        public Long getDossierId() { return dossierId; }
        public void setDossierId(Long dossierId) { this.dossierId = dossierId; }
        public String getSearchSummary() { return searchSummary; }
        public void setSearchSummary(String searchSummary) { this.searchSummary = searchSummary; }
        public String getRiskLevel() { return riskLevel; }
        public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
        public String getDecision() { return decision; }
        public void setDecision(String decision) { this.decision = decision; }
        public String getJustification() { return justification; }
        public void setJustification(String justification) { this.justification = justification; }
        public List<Match> getMatches() { return matches; }
        public void setMatches(List<Match> matches) { this.matches = matches; }
    }

    public static class HistoryItem {
        private Long id;
        private Long dossierId;
        private String checkedBy;
        private LocalDateTime checkedAt;
        private String searchSummary;
        private String riskLevel;
        private int matchesCount;
        private String decision;
        private String justification;
        private List<Match> matches = new ArrayList<>();

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getDossierId() { return dossierId; }
        public void setDossierId(Long dossierId) { this.dossierId = dossierId; }
        public String getCheckedBy() { return checkedBy; }
        public void setCheckedBy(String checkedBy) { this.checkedBy = checkedBy; }
        public LocalDateTime getCheckedAt() { return checkedAt; }
        public void setCheckedAt(LocalDateTime checkedAt) { this.checkedAt = checkedAt; }
        public String getSearchSummary() { return searchSummary; }
        public void setSearchSummary(String searchSummary) { this.searchSummary = searchSummary; }
        public String getRiskLevel() { return riskLevel; }
        public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
        public int getMatchesCount() { return matchesCount; }
        public void setMatchesCount(int matchesCount) { this.matchesCount = matchesCount; }
        public String getDecision() { return decision; }
        public void setDecision(String decision) { this.decision = decision; }
        public String getJustification() { return justification; }
        public void setJustification(String justification) { this.justification = justification; }
        public List<Match> getMatches() { return matches; }
        public void setMatches(List<Match> matches) { this.matches = matches; }
    }
}
