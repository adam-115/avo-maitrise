package com.avo.services;

import com.avo.events.MatterActionEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MatterActivityEventListener {

    private final MatterActivityService activityService;

    @EventListener
    public void handleMatterActionEvent(MatterActionEvent event) {
        activityService.logActivity(
            event.getDossierId(),
            event.getAuthor(),
            event.getAction(),
            event.getTargetType(),
            event.getTargetId(),
            event.getDescription()
        );
    }
}
