package com.avo.dtos.mail;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class FileEmailRequest {
    private Long accountId;
    private String externalMessageId;
    private Long dossierId;
    private boolean importAttachments = true;
}
