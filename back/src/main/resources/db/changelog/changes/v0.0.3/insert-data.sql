-- ============================================================================
-- 1. SECTEURS D'ACTIVITÉ
-- ============================================================================
INSERT INTO secteurs_activite (code, libelle, ordre_affichage, actif, created_at) VALUES 
('IT', 'Technologies de l''information et de la communication', 1, true, NOW()),
('FIN', 'Activités financières et d''assurance', 2, true, NOW()),
('SAN', 'Santé humaine et action sociale', 3, true, NOW()),
('EDU', 'Enseignement et Éducation', 4, true, NOW()),
('BTP', 'Construction et BTP', 5, true, NOW()),
('COM', 'Commerce et Distribution', 6, true, NOW()),
('IND', 'Industrie manufacturière', 7, true, NOW()),
('AGR', 'Agriculture, sylviculture et pêche', 8, true, NOW()),
('IMM', 'Activités immobilières', 9, true, NOW()),
('TRA', 'Transports et entreposage', 10, true, NOW());

-- ============================================================================
-- 2. DOMAINES JURIDIQUES
-- ============================================================================
INSERT INTO domaines_juridiques (code, label, color, active, display_order, created_at) VALUES 
('CIV', 'Droit Civil', '#4F46E5', true, 1, NOW()),
('PEN', 'Droit Pénal', '#DC2626', true, 2, NOW()),
('FIS', 'Droit Fiscal', '#D97706', true, 3, NOW()),
('SOC', 'Droit Social & Travail', '#059669', true, 4, NOW()),
('AFF', 'Droit des Affaires', '#2563EB', true, 5, NOW()),
('IMM', 'Droit Immobilier', '#7C3AED', true, 6, NOW()),
('INT', 'Droit International', '#0891B2', true, 7, NOW()),
('ENV', 'Droit de l''Environnement', '#16A34A', true, 8, NOW());

-- ============================================================================
-- 3. STATUTS DOSSIER
-- ============================================================================
INSERT INTO statuts_dossier (code, label, color, active, display_order, created_at) VALUES 
('NOUVEAU', 'Nouveau Dossier', '#3B82F6', true, 1, NOW()),
('EN_COURS', 'En Cours d''Instruction', '#F59E0B', true, 2, NOW()),
('SUSPENDU', 'Dossier Suspendu', '#EF4444', true, 3, NOW()),
('TERMINE', 'Dossier Clôturé', '#10B981', true, 4, NOW());

-- ============================================================================
-- 4. PRIORITÉS DOSSIER
-- ============================================================================
INSERT INTO dossiers_priorites (code, label, color, active, display_order, created_at) VALUES 
('BASSE', 'Basse Priorité', '#9CA3AF', true, 1, NOW()),
('MOYENNE', 'Priorité Normale', '#3B82F6', true, 2, NOW()),
('HAUTE', 'Haute Priorité', '#F59E0B', true, 3, NOW()),
('URGENTE', 'Priorité Urgente', '#EF4444', true, 4, NOW());

-- ============================================================================
-- 5. CATÉGORIES DE NOTE
-- ============================================================================
INSERT INTO note_categories (code, label, color, active, display_order, created_at) VALUES 
('NOTE_STRATEGIQUE', 'Note Stratégique', '#8B5CF6', true, 1, NOW()),
('NOTE_CONFIDENTIELLE', 'Note Confidentielle', '#EF4444', true, 2, NOW()),
('RDV_MEMO', 'Compte-rendu Entretien', '#10B981', true, 3, NOW()),
('RECHERCHE_DOC', 'Note de Recherche', '#3B82F6', true, 4, NOW());

-- ============================================================================
-- 6. CATÉGORIES DE TÂCHE
-- ============================================================================
INSERT INTO task_categories (code, libelle, couleur, icone, actif, created_at) VALUES 
('REDACTION', 'Rédaction d''actes', '#3B82F6', 'document-text', true, NOW()),
('AUDIENCE', 'Préparation d''Audience', '#EF4444', 'scale', true, NOW()),
('RECHERCHE', 'Recherche Juridique', '#F59E0B', 'search', true, NOW()),
('CLIENT_RDV', 'Rendez-vous Client', '#10B981', 'user-group', true, NOW()),
('FORMALITE', 'Formalités Administratives', '#8B5CF6', 'archive', true, NOW());

-- ============================================================================
-- 7. STATUTS DE TÂCHE
-- ============================================================================
INSERT INTO task_statuses (code, libelle, ordre_affichage, is_closing_status, created_at) VALUES 
('A_FAIRE', 'À faire', 1, false, NOW()),
('EN_COURS', 'En cours', 2, false, NOW()),
('TERMINE', 'Terminé', 3, true, NOW());
