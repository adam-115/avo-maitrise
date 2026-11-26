package com.avo.dtos;

import java.time.LocalDateTime;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@AllArgsConstructor
public class NotificationDTO {
    public NotificationDTO() {}

    private Long id;
    private String title;
    private String message;
    private Long clientId;
    private LocalDateTime createdAt;
    private boolean isRead;
}
