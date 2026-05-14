package com.avo.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.Date;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "app_users")
@Getter
@Setter
@NoArgsConstructor
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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
