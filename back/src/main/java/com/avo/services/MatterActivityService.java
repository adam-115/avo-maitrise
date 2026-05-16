package com.avo.services;

import com.avo.entities.MatterActivity;
import com.avo.repositories.MatterActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class MatterActivityService {

    @Autowired
    private MatterActivityRepository activityRepository;

    public void logActivity(Long dossierId, String author, String action, String targetType, Long targetId, String description) {
        MatterActivity activity = new MatterActivity(dossierId, author, action, targetType, targetId, description);
        activityRepository.save(activity);
    }

    public List<MatterActivity> getActivitiesByDossier(Long dossierId) {
        return activityRepository.findByDossierIdOrderByCreatedAtDesc(dossierId);
    }

    public Page<MatterActivity> searchActivities(Long dossierId, LocalDateTime start, LocalDateTime end, Pageable pageable) {
        if (start != null && end != null) {
            return activityRepository.findByDossierIdAndCreatedAtBetweenOrderByCreatedAtDesc(dossierId, start, end, pageable);
        }
        return activityRepository.findByDossierIdOrderByCreatedAtDesc(dossierId, pageable);
    }
}
