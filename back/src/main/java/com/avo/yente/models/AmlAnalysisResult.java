package com.avo.yente.models;

import java.util.List;

public class AmlAnalysisResult {

    private String yenteId;
    private boolean isPep;
    private boolean isRca;
    private boolean isSanctioned;
    private boolean isFamilyMember;
    private boolean isPoi;
    private boolean isDebarment;
    private boolean isCrime;
    private boolean isFalsePositive;
    private Double matchScore;
    private String matchName;
    private String sanctionReason;
    private String status;
    private List<String> referents;

    public AmlAnalysisResult() {}

    public String getYenteId() { return yenteId; }
    public void setYenteId(String yenteId) { this.yenteId = yenteId; }

    public boolean isPep() { return isPep; }
    public void setPep(boolean pep) { isPep = pep; }

    public boolean isRca() { return isRca; }
    public void setRca(boolean rca) { isRca = rca; }

    public boolean isSanctioned() { return isSanctioned; }
    public void setSanctioned(boolean sanctioned) { isSanctioned = sanctioned; }

    public boolean isFamilyMember() { return isFamilyMember; }
    public void setFamilyMember(boolean familyMember) { isFamilyMember = familyMember; }

    public boolean isPoi() { return isPoi; }
    public void setPoi(boolean poi) { isPoi = poi; }

    public boolean isDebarment() { return isDebarment; }
    public void setDebarment(boolean debarment) { isDebarment = debarment; }

    public boolean isCrime() { return isCrime; }
    public void setCrime(boolean crime) { isCrime = crime; }

    public boolean isFalsePositive() { return isFalsePositive; }
    public void setFalsePositive(boolean falsePositive) { isFalsePositive = falsePositive; }

    public Double getMatchScore() { return matchScore; }
    public void setMatchScore(Double matchScore) { this.matchScore = matchScore; }

    public String getMatchName() { return matchName; }
    public void setMatchName(String matchName) { this.matchName = matchName; }

    public String getSanctionReason() { return sanctionReason; }
    public void setSanctionReason(String sanctionReason) { this.sanctionReason = sanctionReason; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<String> getReferents() { return referents; }
    public void setReferents(List<String> referents) { this.referents = referents; }

    @Override
    public String toString() {
        return "AmlAnalysisResult{" +
                "yenteId='" + yenteId + '\'' +
                ", isPep=" + isPep +
                ", status='" + status + '\'' +
                '}';
    }
}
