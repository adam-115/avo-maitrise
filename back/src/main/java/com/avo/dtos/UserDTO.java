package com.avo.dtos;

import java.util.Date;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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

    @NotBlank(message = "L'adresse email est obligatoire")
    @Email(message = "Le format de l'adresse email est invalide")
    @Size(max = 120, message = "L'email ne peut pas dépasser 120 caractères")
    private String email;

    @NotBlank(message = "Le nom d'utilisateur est obligatoire")
    @Size(min = 3, max = 50, message = "Le nom d'utilisateur doit comporter entre 3 et 50 caractères")
    private String username;

    @NotBlank(message = "Le prénom est obligatoire")
    @Size(max = 60, message = "Le prénom ne peut pas dépasser 60 caractères")
    private String firstName;

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 60, message = "Le nom ne peut pas dépasser 60 caractères")
    private String lastName;

    private String role;
    private java.util.List<String> roles;

    public java.util.List<String> getRoles() {
        if (roles != null && !roles.isEmpty()) {
            return roles;
        }
        if (role != null && !role.isBlank()) {
            return java.util.Arrays.stream(role.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        }
        return java.util.Collections.emptyList();
    }

    public String getRole() {
        if (role != null && !role.isBlank()) {
            return role;
        }
        if (roles != null && !roles.isEmpty()) {
            return String.join(",", roles);
        }
        return "COLLABORATEUR";
    }

    public void setRoles(java.util.List<String> roles) {
        this.roles = roles;
        if (roles != null && !roles.isEmpty()) {
            this.role = String.join(",", roles);
        }
    }

    private String photoBlob;

    @Size(max = 50, message = "L'identifiant au barreau ne peut pas dépasser 50 caractères")
    private String barreauId;

    @Size(max = 30, message = "Le numéro de téléphone ne peut pas dépasser 30 caractères")
    private String phoneNumber;

    @Size(max = 30, message = "Le numéro GSM ne peut pas dépasser 30 caractères")
    private String gsm;

    @Size(max = 255, message = "L'adresse ne peut pas dépasser 255 caractères")
    private String address;

    @com.fasterxml.jackson.annotation.JsonProperty("isPartner")
    private boolean partner;

    @com.fasterxml.jackson.annotation.JsonProperty("isActive")
    private boolean active;

    private String avatarUrl;
    private Date lastLogin;
    private Date createdAt;

    @com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.WRITE_ONLY)
    private String tempPassword;
    private String preferredLanguage;
}
