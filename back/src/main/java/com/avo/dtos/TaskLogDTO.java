package com.avo.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@NoArgsConstructor
public class TaskLogDTO {
    private Long id;
    private Long taskId;
    private String action;
    private String description;
    private Date createdAt;
}
