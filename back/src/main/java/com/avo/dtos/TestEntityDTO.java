package com.avo.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@AllArgsConstructor
@Builder
public class TestEntityDTO {
    public TestEntityDTO() {}

    public static class TestEntityDTOBuilder {
        public TestEntityDTOBuilder() {}
    }


    private Long id;
    private String message;
    private Integer version;

}
