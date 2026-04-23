package com.avo.yente.models;

import java.util.List;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/*
Le score de match (ex: 1.0) vous dit que c'est la bonne personne, 
mais le topic vous dit quoi faire :
Si le topic contient...GravitéAction recommandéesanction 🔴 CritiqueBloquer immédiatement 
et déclarer.role.pep ou role.rca 🟡 ModéréAppliquer une Vigilance Complémentaire (EDD).
debarment ou poi 🟠 ÉlevéAnalyser le contexte avant d'ouvrir un compte.
*/

@ToString
@NoArgsConstructor
@Getter
@Setter
public class AmlAnalysisResult {

    private String yenteId;

    /** Indicates if the client is recognized as a Politically Exposed Person (PEP). */
    private boolean isPep;

    /** Indicates if the client is recognized as a  (RCA) : Relate to political exposed person */
    private boolean isRca;

    /** Indicates if the client is currently subject to any international or local sanctions. */
    private boolean isSanctioned;

    /** Indicates if the client is a family member or close associate of a PEP or sanctioned individual. */
    private boolean isFamilyMember;

    /** Indicates if the client is recognized as a Person Of Interest (POI) */
    private boolean isPoi;

    /** Entreprises exclues des marchés publics (souvent pour fraude ou corruption lors de contrats avec la Banque Mondiale par exemple).*/
    private boolean isDebarment;

    /**Indicates if the client is recognized as a Crime (entities explicitly linked to documented criminal activities)*/
    private boolean isCrime;


    /** Indicates if the client is recognized as a False Positive */
    private boolean isFalsePositive;

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
