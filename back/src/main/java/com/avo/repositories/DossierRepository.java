package com.avo.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;
import com.avo.entities.Dossier;

@Repository
public interface DossierRepository extends JpaRepository<Dossier, Long>, QuerydslPredicateExecutor<Dossier> {

    @org.springframework.data.jpa.repository.Query("SELECT d FROM Dossier d WHERE " +
           "(:searchTerm IS NULL OR :searchTerm = '' OR " +
           " LOWER(d.referenceInterne) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           " LOWER(d.titre) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           " EXISTS (SELECT c FROM ClientEntity c WHERE c.id = d.clientId AND (" +
           "    LOWER(c.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "    (TYPE(c) = ClientPersonnePhysique AND (LOWER(TREAT(c AS ClientPersonnePhysique).nom) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(TREAT(c AS ClientPersonnePhysique).prenom) LIKE LOWER(CONCAT('%', :searchTerm, '%')))) OR " +
           "    (TYPE(c) = ClientMoral AND LOWER(TREAT(c AS ClientMoral).nomCommercial) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) OR " +
           "    (TYPE(c) = Association AND LOWER(TREAT(c AS Association).nom) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) OR " +
           "    (TYPE(c) = Institution AND LOWER(TREAT(c AS Institution).nom) LIKE LOWER(CONCAT('%', :searchTerm, '%')))" +
           " ))" +
           ") AND " +
           "(:statusFilter IS NULL OR :statusFilter = '' OR :statusFilter = 'Tous' OR d.statutID = :statusFilter) AND " +
           "(:lawyerFilter IS NULL OR :lawyerFilter = '' OR :lawyerFilter = 'Tous' OR d.responsableId = :lawyerFilter)")
    org.springframework.data.domain.Page<Dossier> searchWithFilters(
            @org.springframework.data.repository.query.Param("searchTerm") String searchTerm,
            @org.springframework.data.repository.query.Param("statusFilter") String statusFilter,
            @org.springframework.data.repository.query.Param("lawyerFilter") String lawyerFilter,
            org.springframework.data.domain.Pageable pageable);
}
