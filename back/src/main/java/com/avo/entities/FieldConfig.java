package com.avo.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldConfig {

    @Id
    private String id;

    private String name;
    private String type; // text, number, select, etc.
    private String label;
    private boolean required;
    private String errorMessage;
    private String placeholder;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "field_config_id")
    private List<FieldOption> options;
}
