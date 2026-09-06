package com.avo.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.avo.entities.Document;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> , QuerydslPredicateExecutor<Document> {

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM dossier_documents WHERE document_id = :documentId", nativeQuery = true)
    void deleteDossierDocumentAssociation(@Param("documentId") Long documentId);
}

