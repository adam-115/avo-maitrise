package com.avo.dtos;

import lombok.Data;

@Data
public class CabinetProfileDTO {
    private Long id;
    private String name;
    private String address;
    private String city;
    private String postalCode;
    private String country;
    private String phone;
    private String email;
    private String website;
    private String siret;
    private String vatNumber;
    private String iban;
    private String bic;
    // We can omit the byte[] logo in the DTO if we want to handle it separately via MultipartFile,
    // but typically it's returned as base64 string or byte[] if small, or handled via specific endpoint.
    // Let's include it for simple base64 transfer if needed, or we just leave it out and handle via upload endpoint.
    // Actually, including byte[] in DTO is fine for Jackson to serialize as Base64 automatically.
    private byte[] logo;
    private String logoContentType;
}
