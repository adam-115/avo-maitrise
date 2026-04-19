package com.avo.yente.models;

public class AmlAnalysisResult {
    /** Indicates if the client is recognized as a Politically Exposed Person (PEP). */
    private boolean isPep;

    /** Indicates if the client is currently subject to any international or local sanctions. */
    private boolean isSanctioned;

    /** Indicates if the client is a family member or close associate of a PEP or sanctioned individual. */
    private boolean isFamilyMember;

    /** The highest match score returned by the Yente API indicating the confidence of the match. */
    private Double matchScore;

    /** The actual entity name from the Yente dataset that matched the client. */
    private String matchName;

    /** The reason the client was matched, extracting context from dataset topics (e.g., sanctions or PEP). */
    private String sanctionReason;

    /** Overall validation status outcome (e.g., OK, SUSPECT, BLOCKED). */
    private String status;

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
