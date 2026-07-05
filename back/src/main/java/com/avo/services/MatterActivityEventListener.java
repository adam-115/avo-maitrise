package com.avo.services;

import lombok.extern.slf4j.Slf4j;
import com.avo.events.MatterActionEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class MatterActivityEventListener {

    private final MatterActivityService activityService;

    @EventListener
    public void handleMatterActionEvent(MatterActionEvent event) {
        log.info("[ENTER] Executing handleMatterActionEvent");
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
