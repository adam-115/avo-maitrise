package com.avo.dtos;

import java.util.Date;
import java.util.List;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ClientMoralDTO extends ClientEntityDTO {

    private String nomCommercial;
    private String formeJuridique;
    private String numeroRegistreCommerce;
    private String numeroIdFiscal;
    private String nomRepresentantLegal;
    private String prenomRepresentantLegal;
    private String nationaliteRepresentantLegal;
    private String cinRepresentantLegal;
    private Date dateNaissanceRepresentantLegal;
    private List<UBODTO> ubos;

}
