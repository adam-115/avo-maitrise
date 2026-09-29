package com.avo.dto;

import java.util.List;

public class ConflictCheckResultDTO {
    private boolean hasConflict;
    private String message;
    private List<ConflictDetailDTO> details;

    public ConflictCheckResultDTO() {}

    public boolean isHasConflict() {
        return hasConflict;
    }

    public void setHasConflict(boolean hasConflict) {
        this.hasConflict = hasConflict;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<ConflictDetailDTO> getDetails() {
        return details;
    }

    public void setDetails(List<ConflictDetailDTO> details) {
        this.details = details;
    }
}
