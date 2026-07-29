package com.avo.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;
import java.time.OffsetDateTime;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiligenceFormResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "form_config_id")
    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    private FormConfig formConfig;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    @NotFound(action = NotFoundAction.IGNORE)
    private ClientEntity client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ubo_id")
    @NotFound(action = NotFoundAction.IGNORE)
    private UBO ubo;

    private OffsetDateTime creationDate;
    private OffsetDateTime lastUpdateDate;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "diligence_form_result_id")
    private List<FieldResult> fieldResults;

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
