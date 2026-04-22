package com.avo.yente.models;

import java.util.List;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
@ToString
@NoArgsConstructor
@Getter
@Setter
public class AmlAnalysisResult {

    private String refIdenti;

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
    
    /** The referents of the match. */
    private List<String> referents;

}
