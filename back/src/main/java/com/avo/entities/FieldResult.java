package com.avo.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@Builder
public class FieldResult {

    public FieldResult() {}

    public static class FieldResultBuilder {
        public FieldResultBuilder() {}
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fieldConfigId;
    private String fieldOptionId;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String value;
}
