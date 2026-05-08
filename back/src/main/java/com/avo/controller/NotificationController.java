package com.avo.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.avo.dtos.NotificationDTO;
import com.avo.entities.Notification;
import com.avo.repositories.NotificationRepository;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository repository;

    public NotificationController(NotificationRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDTO>> getUnread() {
        return ResponseEntity.ok(repository.findByIsReadFalseOrderByCreatedAtDesc().stream()
                .map(this::toDto)
                .collect(Collectors.toList()));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        repository.findById(id).ifPresent(n -> {
            n.setRead(true);
            repository.save(n);
        });
        return ResponseEntity.ok().build();
    }

    private NotificationDTO toDto(Notification n) {
        return new NotificationDTO(
                n.getId(),
                n.getTitle(),
                n.getMessage(),
                n.getClientId(),
                n.getCreatedAt(),
                n.isRead()
        );
    }
}
