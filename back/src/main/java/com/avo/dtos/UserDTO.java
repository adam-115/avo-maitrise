package com.avo.dtos;

import java.util.Date;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    private Long id;
    private String keycloakId;
    private String email;
    private String username;
    private String firstName;
    private String lastName;
    private String role;
    private String photoBlob;
    private String barreauId;
    private String phoneNumber;
    private String gsm;
    private String address;
    @com.fasterxml.jackson.annotation.JsonProperty("isPartner")
    private boolean partner;

    @com.fasterxml.jackson.annotation.JsonProperty("isActive")
    private boolean active;

    private String avatarUrl;
    private Date lastLogin;
    private Date createdAt;
    private String tempPassword;
    private String preferredLanguage;
}
