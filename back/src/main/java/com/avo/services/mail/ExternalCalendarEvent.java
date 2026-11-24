package com.avo.services.mail;

import java.time.LocalDateTime;

/**
 * Représentation normalisée d'un événement lu depuis un calendrier externe
 * (Google Calendar ou Outlook / Microsoft Graph).
 */
public record ExternalCalendarEvent(
        String externalEventId,
        String title,
        String description,
        String location,
        LocalDateTime start,
        LocalDateTime end,
        boolean allDay,
        boolean cancelled
) {
}
