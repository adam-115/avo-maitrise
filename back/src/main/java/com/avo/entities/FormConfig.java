package com.avo.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.OffsetDateTime;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FormConfig {

    @Id
    private String id;

    @Enumerated(EnumType.STRING)
    private FormType type;

    @Enumerated(EnumType.STRING)
    private ClientTypeEnum targetClientType;

    private String name;
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private OffsetDateTime creationDate;
    private OffsetDateTime lastUpdateDate;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "form_config_id")
    private List<FieldConfig> fields;

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
