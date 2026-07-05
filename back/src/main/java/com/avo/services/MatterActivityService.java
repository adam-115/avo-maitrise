package com.avo.services;

import lombok.extern.slf4j.Slf4j;
import com.avo.entities.MatterActivity;
import com.avo.repositories.MatterActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
public class MatterActivityService {

    @Autowired
    private MatterActivityRepository activityRepository;

    public void logActivity(Long dossierId, String author, String action, String targetType, Long targetId, String description) {
        log.info("[ENTER] Executing logActivity");
        MatterActivity activity = new MatterActivity(dossierId, author, action, targetType, targetId, description);
        activityRepository.save(activity);
    }

    public List<MatterActivity> getActivitiesByDossier(Long dossierId) {
        log.info("[ENTER] Executing getActivitiesByDossier");
        return activityRepository.findByDossierIdOrderByCreatedAtDesc(dossierId);
    }

    public Page<MatterActivity> searchActivities(Long dossierId, LocalDateTime start, LocalDateTime end, Pageable pageable) {
        log.info("[ENTER] Executing searchActivities");
        if (start != null && end != null) {
            return activityRepository.findByDossierIdAndCreatedAtBetweenOrderByCreatedAtDesc(dossierId, start, end, pageable);
        }
        return activityRepository.findByDossierIdOrderByCreatedAtDesc(dossierId, pageable);
    }
}
