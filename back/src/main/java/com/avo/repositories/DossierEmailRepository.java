package com.avo.repositories;

import com.avo.entities.DossierEmail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface DossierEmailRepository extends JpaRepository<DossierEmail, Long> {

    List<DossierEmail> findByDossierIdOrderBySentAtDescFiledAtDesc(Long dossierId);

    long countByDossierId(Long dossierId);

    Optional<DossierEmail> findByDossierIdAndExternalMessageId(Long dossierId, String externalMessageId);

    List<DossierEmail> findByExternalMessageIdIn(Collection<String> externalMessageIds);
}
