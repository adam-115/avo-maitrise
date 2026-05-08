package com.avo.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.avo.entities.AmlAllowList;

@Repository
public interface AmlAllowListRepository extends JpaRepository<AmlAllowList, Long> {
    
    Optional<AmlAllowList> findByClientIdAndYenteId(Long clientId, String yenteId);
    
    Optional<AmlAllowList> findByUboIdAndYenteId(Long uboId, String yenteId);
    
    boolean existsByClientIdAndYenteId(Long clientId, String yenteId);
    
    boolean existsByUboIdAndYenteId(Long uboId, String yenteId);
}
