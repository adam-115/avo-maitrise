-- ============================================================================
-- SCRIPT TO REMOVE ALL SEED DATA ADDED BY fill-test-data.sql
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;

-- ----------------------------------------------------------------------------
-- OPTION 1: PRECISE DELETE (Removes ONLY the specific test data rows by IDs/codes)
-- ----------------------------------------------------------------------------

-- Client Diligence Status, Screening Match, and Screening Execution (cleanup runtime tables)
DELETE FROM client_diligence_status WHERE client_id BETWEEN 11 AND 45 OR form_config_id LIKE 'form-%';
DELETE FROM screening_matches WHERE client_id BETWEEN 11 AND 45;
DELETE FROM screening_execution WHERE client_id BETWEEN 11 AND 45;

-- 22.2 FIELD_RESULT
DELETE FROM field_result WHERE id BETWEEN 1 AND 26;

-- 22.1 DILIGENCE_FORM_RESULT
DELETE FROM diligence_form_result WHERE id IN ('res-001', 'res-002', 'res-003', 'res-004', 'res-005', 'res-006', 'res-007');

-- 21.3 FIELD_OPTION
DELETE FROM field_option WHERE id LIKE 'opt-%';

-- 21.2 FIELD_CONFIG
DELETE FROM field_config WHERE id LIKE 'field-%';

-- 21.1 FORM_CONFIG
DELETE FROM form_config WHERE id LIKE 'form-%';

-- 20. DOSSIER DOCUMENTS LINK
DELETE FROM dossier_documents WHERE dossier_id BETWEEN 1001 AND 1032;

-- 19. DOCUMENTS
DELETE FROM documents WHERE id IN (501, 502, 503, 504, 101, 102, 103, 104, 105, 106, 107);

-- 18. APPOINTEMENTS DE L'AGENDA
DELETE FROM appointements WHERE id BETWEEN 1 AND 40;

-- 17. EVENEMENTS DU DOSSIER (Matter activities)
DELETE FROM matter_activities WHERE id BETWEEN 1 AND 20;

-- 16. TÂCHES ASSIGNÉES
DELETE FROM task_assignees WHERE task_id BETWEEN 1 AND 15;

-- 15. TÂCHES DE DOSSIER
DELETE FROM tasks WHERE id BETWEEN 1 AND 15;

-- 14. NOTES DE DOSSIER
DELETE FROM notes WHERE dossier_id BETWEEN 1001 AND 1032;

-- 13. DOSSIER INTERVENANTS
DELETE FROM dossier_intervenants WHERE dossier_id BETWEEN 1001 AND 1032;

-- 12. DOSSIERS
DELETE FROM dossiers WHERE id BETWEEN 1001 AND 1032;

-- 11. BÉNÉFICIAIRES EFFECTIFS (UBO) ET CONTACT POINTS
DELETE FROM contact_points WHERE id BETWEEN 1 AND 5;
DELETE FROM ubos WHERE id BETWEEN 1 AND 7;

-- 10. CLIENTS SOUS-TABLES (Inheritance Strategy: JOINED)
DELETE FROM institutions WHERE id BETWEEN 41 AND 45;
DELETE FROM associations WHERE id BETWEEN 31 AND 35;
DELETE FROM clients_moraux WHERE id BETWEEN 21 AND 26;
DELETE FROM personnes_physiques WHERE id BETWEEN 11 AND 20;

-- 9. CLIENTS
DELETE FROM clients WHERE id BETWEEN 11 AND 45;

-- 8. UTILISATEURS
DELETE FROM app_users WHERE id BETWEEN 1 AND 5;

-- 7. STATUTS DE TÂCHE
DELETE FROM task_statuses WHERE code IN ('A_FAIRE', 'EN_COURS', 'TERMINE');

-- 6. CATÉGORIES DE TÂCHE
DELETE FROM task_categories WHERE code IN ('REDACTION', 'AUDIENCE', 'RECHERCHE', 'CLIENT_RDV', 'FORMALITE');

-- 5. CATÉGORIES DE NOTE
DELETE FROM note_categories WHERE code IN ('NOTE_STRATEGIQUE', 'NOTE_CONFIDENTIELLE', 'RDV_MEMO', 'RECHERCHE_DOC');

-- 4. PRIORITÉS DOSSIER
DELETE FROM dossiers_priorites WHERE code IN ('BASSE', 'MOYENNE', 'HAUTE', 'URGENTE');

-- 3. STATUTS DOSSIER
DELETE FROM statuts_dossier WHERE code IN ('NOUVEAU', 'EN_COURS', 'SUSPENDU', 'TERMINE');

-- 2. DOMAINES JURIDIQUES
DELETE FROM domaines_juridiques WHERE code IN ('CIV', 'PEN', 'FIS', 'SOC', 'AFF', 'IMM', 'INT', 'ENV');

-- 1. SECTEURS D'ACTIVITÉ
DELETE FROM secteurs_activite WHERE code IN ('IT', 'FIN', 'SAN', 'EDU', 'BTP', 'COM', 'IND', 'AGR', 'IMM', 'TRA');


-- ----------------------------------------------------------------------------
-- OPTION 2: FULL TRUNCATE (Completely empties all these tables - Commented out by default)
-- ----------------------------------------------------------------------------
/*
TRUNCATE TABLE task_assignees;
TRUNCATE TABLE matter_activities;
TRUNCATE TABLE dossier_intervenants;
TRUNCATE TABLE dossier_documents;
TRUNCATE TABLE client_diligence_status;
TRUNCATE TABLE screening_matches;
TRUNCATE TABLE screening_execution;
TRUNCATE TABLE documents;
TRUNCATE TABLE tasks;
TRUNCATE TABLE notes;
TRUNCATE TABLE appointements;
TRUNCATE TABLE dossiers;
TRUNCATE TABLE ubos;
TRUNCATE TABLE contact_points;
TRUNCATE TABLE personnes_physiques;
TRUNCATE TABLE clients_moraux;
TRUNCATE TABLE associations;
TRUNCATE TABLE institutions;
TRUNCATE TABLE clients;
TRUNCATE TABLE app_users;
TRUNCATE TABLE domaines_juridiques;
TRUNCATE TABLE statuts_dossier;
TRUNCATE TABLE dossiers_priorites;
TRUNCATE TABLE note_categories;
TRUNCATE TABLE task_categories;
TRUNCATE TABLE task_statuses;
TRUNCATE TABLE secteurs_activite;
TRUNCATE TABLE field_result;
TRUNCATE TABLE diligence_form_result;
TRUNCATE TABLE field_option;
TRUNCATE TABLE field_config;
TRUNCATE TABLE form_config;
*/

SET SQL_SAFE_UPDATES = 1;
SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
