package com.avo.repositories;

import com.avo.entities.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long>, QuerydslPredicateExecutor<Note> {
    List<Note> findByDossier_Id(Long dossierId);
}
