package com.avo.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.OffsetDateTime;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "client_diligence_status")
public class ClientDiligenceStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    @NotFound(action = NotFoundAction.IGNORE)
    private ClientEntity client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ubo_id")
    @NotFound(action = NotFoundAction.IGNORE)
    private UBO ubo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "form_config_id")
    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    private FormConfig formConfig;

    @Enumerated(EnumType.STRING)
    private DiligenceStatus status;

    private String resultId;

    private OffsetDateTime creationDate;
    private OffsetDateTime lastUpdateDate;

    @Builder.Default
    private boolean enabled = true;

    @PrePersist
    protected void onCreate() {
        creationDate = OffsetDateTime.now();
        lastUpdateDate = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        lastUpdateDate = OffsetDateTime.now();
    }
}
