package com.avo.dtos;

import java.util.Date;
import java.util.List;
import com.avo.entities.ClientStatus;

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
    private String type;
    private ClientStatus clientStatus;
    private Double amlMatchScore;
    private String amlSanctionReason;
    private Date amlLastVerificationDate;
    private List<DocumentDTO> documents;
    private List<ContactPointDTO> contacts;
    private List<ScreeningMatchDTO> screeningMatchDTOs ;

}
