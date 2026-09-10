import os

DTO_DIR = r"d:\avo-maitrise\back\src\main\java\com\avo\dtos"

# 1. UserDTO
user_dto_path = os.path.join(DTO_DIR, "UserDTO.java")
with open(user_dto_path, 'w', encoding='utf-8') as f:
    f.write('''package com.avo.dtos;

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

    @NotBlank(message = "Le rôle est obligatoire")
    private String role;

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
''')

# 2. InvoiceDTO
invoice_dto_path = os.path.join(DTO_DIR, "InvoiceDTO.java")
with open(invoice_dto_path, 'w', encoding='utf-8') as f:
    f.write('''package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import com.avo.entities.InvoiceStatusEnum;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceDTO {
    private Long id;

    @Size(max = 50, message = "Le numéro de facture ne doit pas dépasser 50 caractères")
    private String numeroFacture;

    private InvoiceStatusEnum status;

    @NotNull(message = "La date d'émission est obligatoire")
    private LocalDate issueDate;

    @NotNull(message = "La date d'échéance est obligatoire")
    private LocalDate dueDate;

    private List<InvoiceTimeEntryDTO> invoiceTimeEntries;

    @PositiveOrZero(message = "Le montant sous-total doit être supérieur ou égal à zéro")
    private BigDecimal subtotalAmount;

    @PositiveOrZero(message = "Le taux de taxe doit être positif ou nul")
    private BigDecimal taxRate;

    @PositiveOrZero(message = "Le montant total doit être supérieur ou égal à zéro")
    private BigDecimal totalAmount;

    private int dunningLevel;
    private boolean isDisputed;
    private DossierDTO dossier;

    @Size(max = 1000, message = "La note ne doit pas dépasser 1000 caractères")
    private String note;
}
''')

# 3. DossierDTO
dossier_dto_path = os.path.join(DTO_DIR, "DossierDTO.java")
with open(dossier_dto_path, 'w', encoding='utf-8') as f:
    f.write('''package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;
import java.util.List;
import java.util.ArrayList;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DossierDTO {
    private Long id;

    @Size(max = 50, message = "La référence interne ne doit pas dépasser 50 caractères")
    private String referenceInterne;

    @NotBlank(message = "Le titre du dossier est obligatoire")
    @Size(max = 255, message = "Le titre du dossier ne doit pas dépasser 255 caractères")
    private String titre;

    @Size(max = 2000, message = "La description ne doit pas dépasser 2000 caractères")
    private String description;

    private ClientEntityDTO client;
    private String responsableId;
    private List<String> intervenantsIds = new ArrayList<>();
    private String domaineJuridique;
    private String prioriteID;
    private String statutID;
    private List<DocumentDTO> documents = new ArrayList<>();
    private Date dateOuverture;
    private Date dateCloture;
    private Date updated_at;
}
''')

# 4. CabinetProfileDTO
cabinet_dto_path = os.path.join(DTO_DIR, "CabinetProfileDTO.java")
with open(cabinet_dto_path, 'w', encoding='utf-8') as f:
    f.write('''package com.avo.dtos;

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
    private String nomCabinet;

    @Size(max = 50, message = "Le numéro de barreau ne doit pas dépasser 50 caractères")
    private String barreau;

    @Size(max = 50, message = "Le numéro SIRET/Matricule ne doit pas dépasser 50 caractères")
    private String numeroSiret;

    @Size(max = 255, message = "L'adresse ne doit pas dépasser 255 caractères")
    private String adresse;

    @Size(max = 30, message = "Le téléphone ne doit pas dépasser 30 caractères")
    private String telephone;

    @Email(message = "Format d'email invalide")
    @Size(max = 120, message = "L'email ne doit pas dépasser 120 caractères")
    private String email;

    @Size(max = 255, message = "L'URL du site web ne doit pas dépasser 255 caractères")
    private String siteWeb;

    @Size(max = 50, message = "Le numéro TVA ne doit pas dépasser 50 caractères")
    private String tvaIntracommunautaire;

    @Size(max = 50, message = "L'IBAN ne doit pas dépasser 50 caractères")
    private String iban;

    @Size(max = 20, message = "Le BIC/SWIFT ne doit pas dépasser 20 caractères")
    private String bic;

    private String logoBlob;
    private String mentionsLegales;
}
''')

# 5. UBODTO
ubo_dto_path = os.path.join(DTO_DIR, "UBODTO.java")
with open(ubo_dto_path, 'r', encoding='utf-8') as f:
    ubo_content = f.read()
if "import jakarta.validation.constraints" not in ubo_content:
    ubo_content = ubo_content.replace(
        "package com.avo.dtos;",
        "package com.avo.dtos;\n\nimport jakarta.validation.constraints.NotBlank;\nimport jakarta.validation.constraints.PositiveOrZero;\nimport jakarta.validation.constraints.Max;\nimport jakarta.validation.constraints.Size;"
    )
    ubo_content = ubo_content.replace(
        "private String fullName;",
        "@NotBlank(message = \"Le nom complet du bénéficiaire effectif est obligatoire\")\n    @Size(max = 150)\n    private String fullName;"
    )
    ubo_content = ubo_content.replace(
        "private Double percentageOfOwnership;",
        "@PositiveOrZero(message = \"Le pourcentage doit être supérieur ou égal à 0\")\n    @Max(value = 100, message = \"Le pourcentage ne peut pas dépasser 100%\")\n    private Double percentageOfOwnership;"
    )
    with open(ubo_dto_path, 'w', encoding='utf-8') as f:
        f.write(ubo_content)

print("Key DTOs validated successfully!")
