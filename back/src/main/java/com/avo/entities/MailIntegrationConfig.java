package com.avo.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Configuration globale d'activation du module optionnel Messagerie & Calendrier externe.
 * Par défaut désactivé (enabled = false) afin que l'application fonctionne exactement
 * comme si l'intégration n'existait pas pour les cabinets qui ne souhaitent pas l'utiliser.
 */
@Entity
@Table(name = "mail_integration_config")
@Getter
@Setter
@NoArgsConstructor
public class MailIntegrationConfig {

    @Id
    private Long id = 1L;

    @Column(nullable = false)
    private boolean enabled = false;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void touch() {
        updatedAt = LocalDateTime.now();
    }
}
