package com.avo.audit;

import jakarta.persistence.*;
import org.hibernate.envers.RevisionEntity;
import org.hibernate.envers.RevisionNumber;
import org.hibernate.envers.RevisionTimestamp;

/**
 * Une révision Envers = un lot de modifications enregistré dans une même transaction.
 * Chaque table d'historique (*_aud) pointe vers une révision : on sait ainsi qui a modifié, quand et d'où.
 */
@Entity
@Table(name = "audit_revision")
@RevisionEntity(AuditRevisionListener.class)
public class AuditRevision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @RevisionNumber
    private Long id;

    @RevisionTimestamp
    @Column(name = "revision_timestamp", nullable = false)
    private long timestamp;

    @Column(name = "username", nullable = false, length = 255)
    private String username;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    /** UTILISATEUR ou SYSTEME (tâche planifiée, vérification automatique...). */
    @Column(name = "origin", nullable = false, length = 20)
    private String origin;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getOrigin() { return origin; }
    public void setOrigin(String origin) { this.origin = origin; }
}
