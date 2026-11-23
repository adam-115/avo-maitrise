package com.avo.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Modèle d'acte juridique (mise en demeure, assignation, requête, contrat, bordereau de pièces...)
 * contenant des balises de fusion {{variable}} alimentées automatiquement par les données du dossier.
 */
@Entity
@Table(name = "act_templates")
@Getter
@Setter
@NoArgsConstructor
public class ActTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String code;

    @Column(nullable = false)
    private String titre;

    @Column(nullable = false, length = 40)
    private String categorie; // MISE_EN_DEMEURE, ASSIGNATION, REQUETE, CONTRAT, CONVENTION_HONORAIRES, BORDEREAU, COURRIER

    @Column(nullable = false, length = 30)
    private String pays = "FRANCE"; // FRANCE, LUXEMBOURG, BELGIQUE, SUISSE, ALLEMAGNE, ALL

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 20)
    private String format = "TEXT_TEMPLATE"; // TEXT_TEMPLATE ou DOCX_FILE

    @Column(columnDefinition = "LONGTEXT")
    private String content;

    @Column(name = "minio_object_id")
    private String minioObjectId;

    @Column(name = "nom_fichier")
    private String nomFichier;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
