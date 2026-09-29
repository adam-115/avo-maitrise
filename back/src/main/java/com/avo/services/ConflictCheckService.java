package com.avo.services;

import com.avo.dto.ConflictCheckResultDTO;
import com.avo.dto.ConflictDetailDTO;
import com.avo.entities.Dossier;
import com.avo.entities.DossierPartie;
import com.avo.repositories.DossierPartieRepository;
import com.avo.repositories.DossierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class ConflictCheckService {

    @Autowired
    private DossierRepository dossierRepository;

    @Autowired
    private DossierPartieRepository dossierPartieRepository;

    @Transactional(readOnly = true)
    public ConflictCheckResultDTO checkConflictByContactId(Long contactId) {
        ConflictCheckResultDTO result = new ConflictCheckResultDTO();
        List<ConflictDetailDTO> details = new ArrayList<>();
        
        // 1. Rechercher si le contact est "Client Principal" d'un dossier
        List<Dossier> dossiersAsClient = dossierRepository.findByClientId(contactId);
        for (Dossier d : dossiersAsClient) {
            details.add(new ConflictDetailDTO(
                    d.getId(),
                    d.getTitre(),
                    d.getReferenceInterne(),
                    "CLIENT_PRINCIPAL"
            ));
        }

        // 2. Rechercher si le contact est "Adversaire" ou "Tiers" (DossierPartie)
        List<DossierPartie> dossiersAsPartie = dossierPartieRepository.findByPartieId(contactId);
        for (DossierPartie dp : dossiersAsPartie) {
            details.add(new ConflictDetailDTO(
                    dp.getDossier().getId(),
                    dp.getDossier().getTitre(),
                    dp.getDossier().getReferenceInterne(),
                    dp.getRole().name()
            ));
        }

        if (details.isEmpty()) {
            result.setHasConflict(false);
            result.setMessage("Aucun conflit d'intérêts détecté pour ce contact.");
        } else {
            result.setHasConflict(true);
            result.setMessage("ATTENTION : Ce contact est déjà impliqué dans d'autres dossiers.");
        }
        
        result.setDetails(details);
        return result;
    }
}
