package com.avo.dtos;

import java.time.LocalDateTime;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentDTO {

    private Long id;
    private String nomFichier;
    private String typeDocument;
    private String urlStockage;
    private LocalDateTime dateUpload;
    private boolean estValide;
    private String title;
    private String name;
    private String label;
    private String description;
    private String tags;
    private String filename;
    private Long clientId; // reference to ClientEntity
    private Long dossierId; // reference to Dossier
    private byte[] fileData;

}
