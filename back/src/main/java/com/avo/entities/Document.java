package com.avo.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = true)
    private String nomFichier; // ex: "piece_identite.pdf"

    private String typeDocument; // ex: "ID_CARD", "KBIS", "STATUTS"

    // Frontend compatibility & metadata
    private String title;
    private String name;
    private String label;
    private String description;
    private String tags;
    private String filename;

    // TODO check MinIO to store files or maybe use blob
    private String urlStockage; // Chemin vers le serveur de fichiers ou S3

    private LocalDateTime dateUpload = LocalDateTime.now();

    private boolean estValide = true;

    @jakarta.persistence.Lob
    @Basic(fetch = FetchType.LAZY)
    @Column(name = "file_data", columnDefinition = "LONGBLOB")
    private byte[] fileData;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private ClientEntity client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id")
    private Dossier dossier;

}
