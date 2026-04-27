package com.avo.dtos;

import java.util.Date;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UBODTO {

    private Long id;
    private String fullName;
    private Date dateOfBirth;
    private String nationality;
    private String roleInCompany;
    private Double percentageOfOwnership;
    private String amlAnalysisStatus;
    private Double amlMatchScore;
    private String amlTargetEntityName;
    private String amlSanctionReason;
    private Date amlLastVerificationDate;
    private Long clientMoralId; // reference to ClientMoral

}
