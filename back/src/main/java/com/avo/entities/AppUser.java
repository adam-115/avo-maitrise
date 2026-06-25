package com.avo.entities;

import java.util.Date;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "app_users")
@Getter
@Setter
@NoArgsConstructor
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "keycloak_id", unique = true)
    private String keycloakId;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;
    
    @Column(nullable = false)
    private String role;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String photoBlob;

    private String barreauId;

    private String phoneNumber;

    private String gsm;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "is_partner")
    private boolean isPartner;

    @Column(name = "is_active")
    private boolean isActive;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String avatarUrl;

    @Temporal(TemporalType.TIMESTAMP)
    private Date lastLogin;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", updatable = false)
    private Date createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = new Date();
        }
    }
}
