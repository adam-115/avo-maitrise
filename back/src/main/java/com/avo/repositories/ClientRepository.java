package com.avo.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import com.avo.entities.ClientEntity;
import com.querydsl.core.types.Predicate;

@Repository
public interface ClientRepository extends JpaRepository<ClientEntity, Long> , QuerydslPredicateExecutor<ClientEntity> {

    Page<ClientEntity> findAll(Pageable pageable);
    Page<ClientEntity> findAll(Predicate predicate, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT c FROM ClientEntity c WHERE " +
           "(:searchTerm IS NULL OR :searchTerm = '' OR " +
           " LOWER(c.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           " LOWER(c.pays) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           " LOWER(c.secteurActivite) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           " LOWER(c.adresse) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           " LOWER(c.telephone) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           " (TYPE(c) = ClientPersonnePhysique AND (LOWER(TREAT(c AS ClientPersonnePhysique).nom) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(TREAT(c AS ClientPersonnePhysique).prenom) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(TREAT(c AS ClientPersonnePhysique).cin) LIKE LOWER(CONCAT('%', :searchTerm, '%')))) OR " +
           " (TYPE(c) = ClientMoral AND (LOWER(TREAT(c AS ClientMoral).nomCommercial) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(TREAT(c AS ClientMoral).numeroRegistreCommerce) LIKE LOWER(CONCAT('%', :searchTerm, '%')))) OR " +
           " (TYPE(c) = Association AND (LOWER(TREAT(c AS Association).nom) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(TREAT(c AS Association).numeroRegistreNational) LIKE LOWER(CONCAT('%', :searchTerm, '%')))) OR " +
           " (TYPE(c) = Institution AND (LOWER(TREAT(c AS Institution).nom) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(TREAT(c AS Institution).numeroRegistreNational) LIKE LOWER(CONCAT('%', :searchTerm, '%')))) OR " +
           " EXISTS (SELECT cp FROM ContactPoint cp WHERE cp.client = c AND (" +
           "   LOWER(cp.nom) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "   LOWER(cp.prenom) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "   LOWER(cp.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "   LOWER(cp.telephone) LIKE LOWER(CONCAT('%', :searchTerm, '%'))" +
           " ))" +
           ") AND " +
           "(:type IS NULL OR :type = '' OR " +
           " (:type = 'PERSONNE' AND TYPE(c) = ClientPersonnePhysique) OR " +
           " (:type = 'SOCIETE' AND TYPE(c) = ClientMoral) OR " +
           " (:type = 'ASSOCIATION' AND TYPE(c) = Association) OR " +
           " (:type = 'INSTITUTION' AND TYPE(c) = Institution)" +
           ") AND " +
           "(:status IS NULL OR c.clientStatus = :status) AND " +
           "(:risk IS NULL OR :risk = '' OR " +
           " (:risk = 'ELEVEE' AND (SELECT COALESCE(MAX(m.score), 0.0) FROM ScreeningMatch m WHERE m.client = c) >= 0.7) OR " +
           " (:risk = 'MOYEN' AND (SELECT COALESCE(MAX(m.score), 0.0) FROM ScreeningMatch m WHERE m.client = c) >= 0.4 AND (SELECT COALESCE(MAX(m.score), 0.0) FROM ScreeningMatch m WHERE m.client = c) < 0.7) OR " +
           " (:risk = 'FAIBLE' AND (SELECT COALESCE(MAX(m.score), 0.0) FROM ScreeningMatch m WHERE m.client = c) < 0.4)" +
           ")")
    Page<ClientEntity> searchWithFilters(
            @org.springframework.data.repository.query.Param("searchTerm") String searchTerm,
            @org.springframework.data.repository.query.Param("type") String type,
            @org.springframework.data.repository.query.Param("status") com.avo.entities.ClientStatus status,
            @org.springframework.data.repository.query.Param("risk") String risk,
            Pageable pageable);

}
