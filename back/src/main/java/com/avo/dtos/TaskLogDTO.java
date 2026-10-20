package com.avo.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
public class TaskLogDTO {
    public TaskLogDTO() {}

    private Long id;
    private Long taskId;
    private String action;
    private String description;
    private Date createdAt;
}
