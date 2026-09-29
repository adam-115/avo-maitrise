package com.avo.repositories;

import com.avo.entities.DossierPartie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DossierPartieRepository extends JpaRepository<DossierPartie, Long> {
    
    // Find all cases where a specific client/contact is involved as an adversary/tier
    List<DossierPartie> findByPartieId(Long partieId);
}
