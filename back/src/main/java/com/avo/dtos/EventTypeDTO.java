package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@AllArgsConstructor
@Builder
public class EventTypeDTO {
    public EventTypeDTO() {}

    public static class EventTypeDTOBuilder {
        public EventTypeDTOBuilder() {}
    }

    private Long id;
    private String code;
    private String label;
    private String color;
    private boolean active;
    private Integer order;
    private Date createdAt;
}
