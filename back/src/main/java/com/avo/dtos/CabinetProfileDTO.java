package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CabinetProfileDTO {
    private Long id;

    @NotBlank(message = "Le nom du cabinet est obligatoire")
    @Size(max = 150, message = "Le nom du cabinet ne doit pas dépasser 150 caractères")
    private String name;

    @Size(max = 255, message = "L'adresse ne doit pas dépasser 255 caractères")
    private String address;

    @Size(max = 100, message = "La ville ne doit pas dépasser 100 caractères")
    private String city;

    @Size(max = 20, message = "Le code postal ne doit pas dépasser 20 caractères")
    private String postalCode;

    @Size(max = 100, message = "Le pays ne doit pas dépasser 100 caractères")
    private String country;

    @Size(max = 30, message = "Le numéro de téléphone ne doit pas dépasser 30 caractères")
    private String phone;

    @Email(message = "Format d'email invalide")
    @Size(max = 120, message = "L'email ne doit pas dépasser 120 caractères")
    private String email;

    @Size(max = 255, message = "L'URL du site web ne doit pas dépasser 255 caractères")
    private String website;

    @Size(max = 50, message = "Le SIRET ne doit pas dépasser 50 caractères")
    private String siret;

    @Size(max = 50, message = "Le numéro TVA ne doit pas dépasser 50 caractères")
    private String vatNumber;

    @Size(max = 50, message = "L'IBAN ne doit pas dépasser 50 caractères")
    private String iban;

    @Size(max = 20, message = "Le BIC ne doit pas dépasser 20 caractères")
    private String bic;

    private byte[] logo;
    private String logoContentType;
    private String currency;
    private Double tvaRate;
}
