package com.avo.dtos;

import java.util.Date;

public class UBODTO {

    private Long id;
    private String fullName;
    private Date dateOfBirth;
    private String nationality;
    private String roleInCompany;
    private Double percentageOfOwnership;
    private String amlAnalysisStatus;
    private String amlTargetEntityName;
    private Long clientMoralId;

    public UBODTO() {}

    public UBODTO(Long id, String fullName, Date dateOfBirth, String nationality, String roleInCompany, Double percentageOfOwnership, String amlAnalysisStatus, String amlTargetEntityName, Long clientMoralId) {
        this.id = id;
        this.fullName = fullName;
        this.dateOfBirth = dateOfBirth;
        this.nationality = nationality;
        this.roleInCompany = roleInCompany;
        this.percentageOfOwnership = percentageOfOwnership;
        this.amlAnalysisStatus = amlAnalysisStatus;
        this.amlTargetEntityName = amlTargetEntityName;
        this.clientMoralId = clientMoralId;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public Date getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(Date dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getNationality() { return nationality; }
    public void setNationality(String nationality) { this.nationality = nationality; }

    public String getRoleInCompany() { return roleInCompany; }
    public void setRoleInCompany(String roleInCompany) { this.roleInCompany = roleInCompany; }

    public Double getPercentageOfOwnership() { return percentageOfOwnership; }
    public void setPercentageOfOwnership(Double percentageOfOwnership) { this.percentageOfOwnership = percentageOfOwnership; }

    public String getAmlAnalysisStatus() { return amlAnalysisStatus; }
    public void setAmlAnalysisStatus(String amlAnalysisStatus) { this.amlAnalysisStatus = amlAnalysisStatus; }

    public String getAmlTargetEntityName() { return amlTargetEntityName; }
    public void setAmlTargetEntityName(String amlTargetEntityName) { this.amlTargetEntityName = amlTargetEntityName; }

    public Long getClientMoralId() { return clientMoralId; }
    public void setClientMoralId(Long clientMoralId) { this.clientMoralId = clientMoralId; }

    public static UBODTOBuilder builder() {
        return new UBODTOBuilder();
    }

    public static class UBODTOBuilder {
        private Long id;
        private String fullName;
        private Date dateOfBirth;
        private String nationality;
        private String roleInCompany;
        private Double percentageOfOwnership;
        private String amlAnalysisStatus;
        private String amlTargetEntityName;
        private Long clientMoralId;

        public UBODTOBuilder id(Long id) { this.id = id; return this; }
        public UBODTOBuilder fullName(String fullName) { this.fullName = fullName; return this; }
        public UBODTOBuilder dateOfBirth(Date dateOfBirth) { this.dateOfBirth = dateOfBirth; return this; }
        public UBODTOBuilder nationality(String nationality) { this.nationality = nationality; return this; }
        public UBODTOBuilder roleInCompany(String roleInCompany) { this.roleInCompany = roleInCompany; return this; }
        public UBODTOBuilder percentageOfOwnership(Double percentageOfOwnership) { this.percentageOfOwnership = percentageOfOwnership; return this; }
        public UBODTOBuilder amlAnalysisStatus(String amlAnalysisStatus) { this.amlAnalysisStatus = amlAnalysisStatus; return this; }
        public UBODTOBuilder amlTargetEntityName(String amlTargetEntityName) { this.amlTargetEntityName = amlTargetEntityName; return this; }
        public UBODTOBuilder clientMoralId(Long clientMoralId) { this.clientMoralId = clientMoralId; return this; }

        public UBODTO build() {
            return new UBODTO(id, fullName, dateOfBirth, nationality, roleInCompany, percentageOfOwnership, amlAnalysisStatus, amlTargetEntityName, clientMoralId);
        }
    }
}
