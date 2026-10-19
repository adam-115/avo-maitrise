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
public class FieldOption {

    public FieldOption() {}

    public static class FieldOptionBuilder {
        public FieldOptionBuilder() {}
    }

    @Id
    private String id;

    private String name;
    private String value;
}
