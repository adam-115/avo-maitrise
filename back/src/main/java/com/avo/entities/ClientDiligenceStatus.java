package com.avo.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.OffsetDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientDiligenceStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private ClientEntity client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "form_config_id")
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
