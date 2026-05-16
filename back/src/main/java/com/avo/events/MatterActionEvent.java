package com.avo.events;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class MatterActionEvent extends ApplicationEvent {
    private final Long dossierId;
    private final String author;
    private final String action;
    private final String targetType;
    private final Long targetId;
    private final String description;

    public MatterActionEvent(Object source, Long dossierId, String author, String action, String targetType, Long targetId, String description) {
        super(source);
        this.dossierId = dossierId;
        this.author = author;
        this.action = action;
        this.targetType = targetType;
        this.targetId = targetId;
        this.description = description;
    }
}
