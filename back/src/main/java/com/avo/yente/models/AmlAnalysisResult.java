package com.avo.yente.models;

public class AmlAnalysisResult {
    private boolean isPep;
    private boolean isSanctioned;
    private boolean isFamilyMember;
    private Double matchScore;
    private String matchName;
    private String sanctionReason;
    private String status; // OK, SUSPECT, BLOCKED

    public boolean isPep() {
        return isPep;
    }

    public void setPep(boolean pep) {
        isPep = pep;
    }

    public boolean isSanctioned() {
        return isSanctioned;
    }

    public void setSanctioned(boolean sanctioned) {
        isSanctioned = sanctioned;
    }

    public boolean isFamilyMember() {
        return isFamilyMember;
    }

    public void setFamilyMember(boolean familyMember) {
        isFamilyMember = familyMember;
    }

    public Double getMatchScore() {
        return matchScore;
    }

    public void setMatchScore(Double matchScore) {
        this.matchScore = matchScore;
    }

    public String getMatchName() {
        return matchName;
    }

    public void setMatchName(String matchName) {
        this.matchName = matchName;
    }

    public String getSanctionReason() {
        return sanctionReason;
    }

    public void setSanctionReason(String sanctionReason) {
        this.sanctionReason = sanctionReason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
