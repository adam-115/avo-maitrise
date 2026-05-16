package com.avo.dtos;

import java.time.LocalDateTime;

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
    private Long clientId;
    private Long dossierId;
    private byte[] fileData;

    public DocumentDTO() {}

    public DocumentDTO(Long id, String nomFichier, String typeDocument, String urlStockage, LocalDateTime dateUpload, boolean estValide, String title, String name, String label, String description, String tags, String filename, Long clientId, Long dossierId, byte[] fileData) {
        this.id = id;
        this.nomFichier = nomFichier;
        this.typeDocument = typeDocument;
        this.urlStockage = urlStockage;
        this.dateUpload = dateUpload;
        this.estValide = estValide;
        this.title = title;
        this.name = name;
        this.label = label;
        this.description = description;
        this.tags = tags;
        this.filename = filename;
        this.clientId = clientId;
        this.dossierId = dossierId;
        this.fileData = fileData;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNomFichier() { return nomFichier; }
    public void setNomFichier(String nomFichier) { this.nomFichier = nomFichier; }

    public String getTypeDocument() { return typeDocument; }
    public void setTypeDocument(String typeDocument) { this.typeDocument = typeDocument; }

    public String getUrlStockage() { return urlStockage; }
    public void setUrlStockage(String urlStockage) { this.urlStockage = urlStockage; }

    public LocalDateTime getDateUpload() { return dateUpload; }
    public void setDateUpload(LocalDateTime dateUpload) { this.dateUpload = dateUpload; }

    public boolean isEstValide() { return estValide; }
    public void setEstValide(boolean estValide) { this.estValide = estValide; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public Long getDossierId() { return dossierId; }
    public void setDossierId(Long dossierId) { this.dossierId = dossierId; }

    public byte[] getFileData() { return fileData; }
    public void setFileData(byte[] fileData) { this.fileData = fileData; }

    public static DocumentDTOBuilder builder() {
        return new DocumentDTOBuilder();
    }

    public static class DocumentDTOBuilder {
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
        private Long clientId;
        private Long dossierId;
        private byte[] fileData;

        public DocumentDTOBuilder id(Long id) { this.id = id; return this; }
        public DocumentDTOBuilder nomFichier(String nomFichier) { this.nomFichier = nomFichier; return this; }
        public DocumentDTOBuilder typeDocument(String typeDocument) { this.typeDocument = typeDocument; return this; }
        public DocumentDTOBuilder urlStockage(String urlStockage) { this.urlStockage = urlStockage; return this; }
        public DocumentDTOBuilder dateUpload(LocalDateTime dateUpload) { this.dateUpload = dateUpload; return this; }
        public DocumentDTOBuilder estValide(boolean estValide) { this.estValide = estValide; return this; }
        public DocumentDTOBuilder title(String title) { this.title = title; return this; }
        public DocumentDTOBuilder name(String name) { this.name = name; return this; }
        public DocumentDTOBuilder label(String label) { this.label = label; return this; }
        public DocumentDTOBuilder description(String description) { this.description = description; return this; }
        public DocumentDTOBuilder tags(String tags) { this.tags = tags; return this; }
        public DocumentDTOBuilder filename(String filename) { this.filename = filename; return this; }
        public DocumentDTOBuilder clientId(Long clientId) { this.clientId = clientId; return this; }
        public DocumentDTOBuilder dossierId(Long dossierId) { this.dossierId = dossierId; return this; }
        public DocumentDTOBuilder fileData(byte[] fileData) { this.fileData = fileData; return this; }

        public DocumentDTO build() {
            return new DocumentDTO(id, nomFichier, typeDocument, urlStockage, dateUpload, estValide, title, name, label, description, tags, filename, clientId, dossierId, fileData);
        }
    }
}
