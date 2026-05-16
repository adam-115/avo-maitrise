package com.avo.controllers;

import com.avo.entities.MatterActivity;
import com.avo.services.MatterActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/matter-activities")
public class MatterActivityController {

    @Autowired
    private MatterActivityService activityService;

    @GetMapping("/dossier/{dossierId}")
    public List<MatterActivity> getActivitiesByDossier(@PathVariable Long dossierId) {
        return activityService.getActivitiesByDossier(dossierId);
    }

    @GetMapping("/dossier/{dossierId}/search")
    public Page<MatterActivity> searchActivities(
            @PathVariable Long dossierId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            Pageable pageable) {
        return activityService.searchActivities(dossierId, start, end, pageable);
    }
}
