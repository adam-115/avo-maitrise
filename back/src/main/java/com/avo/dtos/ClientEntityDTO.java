package com.avo.dtos;

import java.util.Date;
import java.util.List;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ClientEntityDTO {

    private Long id;
    private String email;
    private String telephone;
    private String adresse;
    private String pays;
    private String amlAnalysisStatus;
    private Double amlMatchScore;
    private String amlTargetEntityName;
    private String amlSanctionReason;
    private Date amlLastVerificationDate;
    private List<DocumentDTO> documents;

}
