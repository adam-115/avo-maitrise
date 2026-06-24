-- ============================================================================
-- MASSIVE SEED DATA SCRIPT FOR AVO-MAITRISE (MYSQL COMPATIBLE)
-- REPRESENTING 6+ MONTHS OF INTENSE LAW FIRM OPERATIONS
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;

-- Clean existing data to ensure a clean, repeatable state
TRUNCATE TABLE task_assignees;
TRUNCATE TABLE client_diligence_status;
TRUNCATE TABLE screening_match;
TRUNCATE TABLE screening_execution;
TRUNCATE TABLE matter_activities;
TRUNCATE TABLE dossier_intervenants;
TRUNCATE TABLE dossier_documents;
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

SET FOREIGN_KEY_CHECKS = 1;

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

-- ============================================================================
-- 8. UTILISATEURS (Cabinet Cabinet-Avocats)
-- ============================================================================
INSERT INTO app_users (id, email, username, first_name, last_name, role, is_partner, is_active, created_at, avatar_url) VALUES 
(1, 'jean.dupont@avo.com', 'jdupont', 'Jean', 'Dupont', 'ROLE_AVOCAT', true, true, NOW(), 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'),
(2, 'marie.laurent@avo.com', 'mlaurent', 'Marie', 'Laurent', 'ROLE_AVOCAT', true, true, NOW(), 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'),
(3, 'pierre.simon@avo.com', 'psimon', 'Pierre', 'Simon', 'ROLE_AVOCAT', false, true, NOW(), 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'),
(4, 'sophie.bernard@avo.com', 'sbernard', 'Sophie', 'Bernard', 'ROLE_AVOCAT', false, true, NOW(), 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'),
(5, 'lucas.martin@avo.com', 'lmartin', 'Lucas', 'Martin', 'ROLE_ASSISTANT', false, true, NOW(), 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150');

-- ============================================================================
-- 9. CLIENTS (Base Table: clients)
-- ============================================================================
-- 9.1 PERSONNES PHYSIQUES (IDs: 11-30)
INSERT INTO clients (id, email, telephone, adresse, pays, client_status, secteur_activite, created_at) VALUES 
(11, 'vladimir.putin@email.ru', '+33612345678', '45 Rue de Courcelles, Paris', 'Russie', 'VERIFICATION_AML_REQUIRED', 'IT', '2026-01-05 09:00:00'),
(12, 'sophie.dubois@email.com', '+33698765432', '12 Avenue des Gobelins, Paris', 'France', 'VALIDATED', 'SAN', '2026-01-15 10:30:00'),
(13, 'michel.rodriguez@email.com', '+33644556677', '89 Boulevard de la Liberté, Lille', 'France', 'VALIDATED', 'BTP', '2026-02-02 11:15:00'),
(14, 'roman.abramovich@email.ru', '+491701234567', 'Kaiserstraße 12, Frankfurt', 'Russie', 'VERIFICATION_AML_REQUIRED', 'FIN', '2026-02-14 14:00:00'),
(15, 'sarah.connor@email.com', '+12135550199', '742 Evergreen Terrace, Los Angeles', 'USA', 'VALIDATED', 'IND', '2026-03-01 16:45:00'),
(16, 'nicolas.sarkozy@email.fr', '+33600223344', '8 Place de l''Étoile, Paris', 'France', 'VALIDATED', 'IMM', '2026-03-10 08:30:00'),
(17, 'viktor.vekselberg@email.ru', '+33688990011', '14 Rue de la Gare, Lyon', 'Russie', 'VERIFICATION_AML_REQUIRED', 'EDU', '2026-03-22 13:10:00'),
(18, 'thomas.dubois@email.com', '+33622446688', '56 Avenue Foch, Nice', 'France', 'VALIDATED', 'TRA', '2026-04-05 09:20:00'),
(19, 'emma.watson@email.co.uk', '+442079460192', '22 Baker St, London', 'Royaume-Uni', 'VALIDATED', 'COM', '2026-04-18 15:40:00'),
(20, 'david.beckham@email.com', '+13105550143', '100 Ocean Drive, Miami', 'USA', 'VALIDATED', 'SAN', '2026-05-01 11:00:00');

-- 9.2 CLIENTS MORAUX (IDs: 21-30)
INSERT INTO clients (id, email, telephone, adresse, pays, client_status, secteur_activite, created_at) VALUES 
(21, 'contact@novatech.fr', '+33140506070', '102 Rond-Point du Progrès, Lyon', 'France', 'VALIDATED', 'IT', '2026-05-12 14:15:00'),
(22, 'finance@sberbank.ru', '+33240302010', 'Z.I. Plaine de l''Ain, Blyes', 'Russie', 'VERIFICATION_AML_REQUIRED', 'BTP', '2026-05-15 10:00:00'),
(23, 'info@luxeglobal.ch', '+41223334455', 'Rue du Rhône 42, Genève', 'Suisse', 'VALIDATED', 'COM', '2026-05-20 09:30:00'),
(24, 'legal@vtb.ru', '+35226123456', 'Avenue John F. Kennedy, Luxembourg', 'Russie', 'VERIFICATION_AML_REQUIRED', 'FIN', '2026-05-25 16:00:00'),
(25, 'ops@redalert.ru', '+7495000000', 'Red Square 5, Moscow', 'Russie', 'VALIDATED', 'TRA', '2026-05-28 11:20:00'),
(26, 'contact@solargroup.de', '+49301234567', 'Sonnenallee 89, Berlin', 'Allemagne', 'VALIDATED', 'ENV', '2026-05-30 15:50:00');

-- 9.3 ASSOCIATIONS (IDs: 31-40)
INSERT INTO clients (id, email, telephone, adresse, pays, client_status, secteur_activite, created_at) VALUES 
(31, 'contact@ecogreen.org', '+33320304050', '5 Rue Verte, Strasbourg', 'France', 'VALIDATED', 'AGR', '2026-06-01 09:00:00'),
(32, 'solidarite@humanright.org', '+33177889900', '18 Rue de la Paix, Paris', 'France', 'VALIDATED', 'EDU', '2026-06-02 10:15:00'),
(33, 'admin@sportactive.fr', '+33491001122', '45 Traverse de la Pointe, Marseille', 'France', 'VALIDATED', 'SAN', '2026-06-03 14:30:00'),
(34, 'contact@artculture.org', '+33144556677', '12 Rue de l''Odéon, Paris', 'France', 'VALIDATED', 'EDU', '2026-06-04 11:00:00'),
(35, 'direction@sauvetage.org', '+33298001122', 'Port de Plaisance, Brest', 'France', 'VALIDATED', 'SAN', '2026-06-05 16:45:00');

-- 9.4 INSTITUTIONS (IDs: 41-50)
INSERT INTO clients (id, email, telephone, adresse, pays, client_status, secteur_activite, created_at) VALUES 
(41, 'secretariat@mairie-bordeaux.fr', '+33556102030', 'Place Pey-Berland, Bordeaux', 'France', 'VALIDATED', 'EDU', '2026-06-06 08:30:00'),
(42, 'contact@ch-universitaire.fr', '+33380293031', '2 Boulevard de Lattre de Tassigny, Dijon', 'France', 'VALIDATED', 'SAN', '2026-06-07 10:00:00'),
(43, 'droit@port-autonome.fr', '+33235192021', 'Boulevard de Strasbourg, Le Havre', 'France', 'VALIDATED', 'TRA', '2026-06-08 13:15:00'),
(44, 'legal@conseil-regional.fr', '+33472617261', '1 Boulevard des Belges, Lyon', 'France', 'VALIDATED', 'EDU', '2026-06-09 15:40:00'),
(45, 'admin@universite-paris.fr', '+33140462015', '17 Rue de la Sorbonne, Paris', 'France', 'VALIDATED', 'EDU', '2026-06-10 09:00:00');

-- ============================================================================
-- 10. CLIENTS SOUS-TABLES (Inheritance Strategy: JOINED)
-- ============================================================================
-- 10.1 personnes_physiques
INSERT INTO personnes_physiques (id, nom, prenom, nationalite, cin, date_naissance) VALUES 
(11, 'Putin', 'Vladimir', 'Russe', 'CIN-1122', '1952-10-07'),
(12, 'Dubois', 'Sophie', 'Française', 'CIN-3344', '1975-11-23'),
(13, 'Rodriguez', 'Michel', 'Espagnole', 'CIN-5566', '1968-08-02'),
(14, 'Abramovich', 'Roman', 'Russe', 'CIN-7788', '1966-10-24'),
(15, 'Connor', 'Sarah', 'Américaine', 'CIN-9900', '1985-07-12'),
(16, 'Sarkozy', 'Nicolas', 'Française', 'CIN-NICO-77', '1955-01-28'),
(17, 'Vekselberg', 'Viktor', 'Russe', 'CIN-8822', '1957-04-14'),
(18, 'Dubois', 'Thomas', 'Française', 'CIN-8933', '1980-02-15'),
(19, 'Watson', 'Emma', 'Britannique', 'CIN-WAT-90', '1990-04-15'),
(20, 'Beckham', 'David', 'Britannique', 'CIN-BECK-75', '1975-05-02');

-- 10.2 clients_moraux
INSERT INTO clients_moraux (id, nom_commercial, forme_juridique, numero_registre_commerce, numero_id_fiscal, nom_representant_legal, prenom_representant_legal, nationalite_representant_legal, cin_representant_legal, date_naissance_representant_legal) VALUES 
(21, 'NovaTech SAS', 'SAS', 'RCS LYON B 123 456 789', 'FR-TAX-123456789', 'Martin', 'Thierry', 'Française', 'CIN-REP-21', '1970-04-05'),
(22, 'Sberbank of Russia PJSC', 'SARL', 'RCS BOURG B 987 654 321', 'RU-TAX-987654321', 'Abramovich', 'Roman', 'Russe', 'CIN-REP-22', '1966-10-24'),
(23, 'Luxe Global SA', 'SA', 'CHE-123.456.789 MWST', 'CH-TAX-1234567', 'Rossi', 'Elena', 'Italienne', 'CIN-REP-23', '1978-12-15'),
(24, 'VTB Bank PJSC', 'SA', 'RCS LUXEMBOURG B 555666', 'RU-TAX-555666', 'Vekselberg', 'Viktor', 'Russe', 'CIN-REP-24', '1957-04-14'),
(25, 'Red Alert Trading', 'LLC', 'RCS MOSCOW 000123', 'RU-TAX-666', 'Ivanov', 'Dmitry', 'Russe', 'CIN-REP-25', '1981-08-25'),
(26, 'SolarGroup Gmbh', 'Gmbh', 'HRB BERLIN 112233', 'DE-TAX-112233', 'Schulz', 'Hans', 'Allemande', 'CIN-REP-26', '1973-10-12');

-- 10.3 associations
INSERT INTO associations (id, nom, numero_registre_national, numero_id_fiscal, nom_representant_legal, prenom_representant_legal, nationalite_representant_legal, cin_representant_legal, date_naissance_representant_legal) VALUES 
(31, 'EcoGreen Europe', 'W12345678', 'ASSOC-TAX-31', 'Petit', 'Isabelle', 'Française', 'CIN-REP-31', '1973-10-09'),
(32, 'Human Rights Network', 'W98765432', 'ASSOC-TAX-32', 'Mandela', 'Gabriel', 'Française', 'CIN-REP-32', '1981-06-25'),
(33, 'Sport Active Marseille', 'W55544433', 'ASSOC-TAX-33', 'Zidane', 'Yazid', 'Française', 'CIN-REP-33', '1972-06-23'),
(34, 'Art & Culture Paris', 'W11223344', 'ASSOC-TAX-34', 'Renoir', 'Pierre', 'Française', 'CIN-REP-34', '1964-07-14'),
(35, 'Sauvetage Côtier Finistère', 'W44332211', 'ASSOC-TAX-35', 'Tabarly', 'Eric', 'Française', 'CIN-REP-35', '1961-05-19');

-- 10.4 institutions
INSERT INTO institutions (id, nom, numero_registre_national, numero_id_fiscal, nom_representant_legal, prenom_representant_legal, nationalite_representant_legal, cin_representant_legal, date_naissance_representant_legal) VALUES 
(41, 'Ville de Bordeaux', 'SIRET-21330063900010', 'INST-TAX-41', 'Hurmic', 'Pierre', 'Française', 'CIN-REP-41', '1955-03-25'),
(42, 'Centre Hospitalier Universitaire Dijon', 'SIRET-26210163600013', 'INST-TAX-42', 'Cochet', 'François', 'Française', 'CIN-REP-42', '1962-02-17'),
(43, 'Grand Port Maritime de Rouen', 'SIRET-18006001800045', 'INST-TAX-43', 'Besse', 'Philippe', 'Française', 'CIN-REP-43', '1960-07-30'),
(44, 'Région Auvergne-Rhône-Alpes', 'SIRET-20005375900011', 'INST-TAX-44', 'Wauquiez', 'Laurent', 'Française', 'CIN-REP-44', '1975-04-12'),
(45, 'Université Paris 1 Panthéon-Sorbonne', 'SIRET-19751717800019', 'INST-TAX-45', 'Guillaume', 'Stéphane', 'Française', 'CIN-REP-45', '1967-11-20');

-- ============================================================================
-- 11. BÉNÉFICIAIRES EFFECTIFS (UBO) ET CONTACT POINTS
-- ============================================================================
INSERT INTO ubos (id, full_name, nationality, role_in_company, percentage_of_ownership, client_id, aml_analysis_status) VALUES 
(1, 'Thierry Martin', 'Française', 'CEO & Fondateur', 60.0, 21, 'OK'),
(2, 'Sylvie Martin', 'Française', 'Actionnaire', 40.0, 21, 'OK'),
(3, 'Roman Abramovich', 'Russe', 'Gérant majoritaire', 75.0, 22, 'VERIFICATION_AML_REQUIRED'),
(4, 'Elena Rossi', 'Italienne', 'Administrateur délégué', 51.0, 23, 'OK'),
(5, 'Viktor Vekselberg', 'Russe', 'Directeur Général', 10.0, 24, 'VERIFICATION_AML_REQUIRED'),
(6, 'Dmitry Ivanov', 'Russe', 'Owner', 100.0, 25, 'OK'),
(7, 'Hans Schulz', 'Allemande', 'Managing Director', 80.0, 26, 'OK');

INSERT INTO contact_points (id, nom, prenom, email, telephone, occupation, client_id) VALUES 
(1, 'Lemoine', 'Claire', 'c.lemoine@novatech.fr', '+33140506071', 'Directrice Juridique', 21),
(2, 'Durand', 'Paul', 'p.durand@batibuild.com', '+33240302012', 'Directeur Financier', 22),
(3, 'Meylan', 'François', 'f.meylan@luxeglobal.ch', '+41223334459', 'Directeur Compliance', 23),
(4, 'Smirnoff', 'Olga', 'o.smirnoff@redalert.ru', '+74950000008', 'Legal Officer', 25),
(5, 'Kohl', 'Helmut', 'h.kohl@solargroup.de', '+49301234569', 'Chief Counsel', 26);

-- ============================================================================
-- 12. DOSSIERS (Matters - 40 realistic matters over the past 6 months)
-- ============================================================================
-- Incorporating completed dossiers (budget & timeline calculations), active, and suspended ones
INSERT INTO dossiers (id, reference_interne, titre, description, client_id, responsable_id, domaine_juridique, priorite_id, statut_id, date_ouverture, date_cloture, budget_estime, taux_horaire_applique, methode_facturation, updated_at) VALUES 
-- Active matters in May 2026 (KPI Current Month Dashboard)
(1001, 'DOS-2026-001', 'Levée de fonds NovaTech Série A', 'Accompagnement de NovaTech SAS dans le cadre de sa levée de fonds de 5M auprès de VCs.', 21, '1', 'AFF', 'URGENTE', 'EN_COURS', '2026-05-02 09:00:00', NULL, 25000.0, 250.0, 'HORAIRE', NOW()),
(1002, 'DOS-2026-002', 'Litige BatiBuild contre Sous-Traitant', 'Contentieux commercial suite à des retards sur le chantier de la résidence du Lac.', 22, '3', 'CIV', 'HAUTE', 'EN_COURS', '2026-05-05 10:00:00', NULL, 8000.0, 200.0, 'HORAIRE', NOW()),
(1003, 'DOS-2026-003', 'Acquisition Mairie de Bordeaux - Foncier', 'Dossier d''acquisition par expropriation d''un terrain pour aménagement urbain.', 41, '2', 'IMM', 'MOYENNE', 'EN_COURS', '2026-05-10 11:30:00', NULL, 12000.0, 220.0, 'HORAIRE', NOW()),
(1004, 'DOS-2026-004', 'Défense Alexis Vidal - Roulage', 'Représentation pénale pour excès de vitesse et conduite sous suspension administrative.', 11, '4', 'PEN', 'HAUTE', 'EN_COURS', '2026-05-01 14:00:00', NULL, 3000.0, 180.0, 'FORFAIT', NOW()),
(1005, 'DOS-2026-005', 'Audit RGPD CHU Dijon', 'Mise en conformité générale des flux de données patients et rédaction des chartes.', 42, '1', 'INT', 'MOYENNE', 'NOUVEAU', '2026-05-14 09:30:00', NULL, 20000.0, 250.0, 'HORAIRE', NOW()),
(1006, 'DOS-2026-006', 'Licenciement Économique Collectif NovaTech', 'Accompagnement PSE concernant 12 salariés administratifs suite à restructuration.', 21, '2', 'SOC', 'HAUTE', 'EN_COURS', '2026-05-03 14:00:00', NULL, 9500.0, 240.0, 'HORAIRE', NOW()),
(1007, 'DOS-2026-007', 'Contrat Distribution Luxe Global', 'Rédaction et négociation du contrat de distribution exclusive pour l''Asie.', 23, '1', 'AFF', 'HAUTE', 'TERMINE', '2026-05-04 10:00:00', '2026-05-15 17:00:00', 6000.0, 250.0, 'FORFAIT', NOW()),
(1008, 'DOS-2026-008', 'Défense Sport Active - Responsabilité Civile', 'Procédure engagée par un adhérent suite à une blessure lors d''une séance d''entraînement.', 33, '3', 'CIV', 'BASSE', 'TERMINE', '2026-05-06 09:00:00', '2026-05-16 12:00:00', 4500.0, 190.0, 'FORFAIT', NOW()),
(1009, 'DOS-2026-009', 'Restructuration Fiscale Alpha Finance', 'Conseil fiscal transfrontalier pour optimisation de l''impôt sur les sociétés.', 24, '2', 'FIS', 'URGENTE', 'EN_COURS', '2026-05-12 11:00:00', NULL, 30000.0, 300.0, 'HORAIRE', NOW()),
(1010, 'DOS-2026-010', 'Contestation Référé Expulsion Sophie Dubois', 'Action d''urgence contre un commandement de quitter les lieux d''un appartement commercial.', 12, '4', 'IMM', 'HAUTE', 'EN_COURS', '2026-05-08 16:30:00', NULL, 4000.0, 200.0, 'FORFAIT', NOW()),
(1011, 'DOS-2026-011', 'Création Fondation Human Rights Network', 'Démarches d''obtention du statut d''utilité publique de la nouvelle entité européenne.', 32, '3', 'CIV', 'MOYENNE', 'NOUVEAU', '2026-05-15 15:00:00', NULL, 5000.0, 200.0, 'FORFAIT', NOW()),
(1012, 'DOS-2026-012', 'Litige Douanier Port Autonome', 'Contestation administrative des amendes douanières sur les marchandises en transit.', 43, '2', 'INT', 'MOYENNE', 'EN_COURS', '2026-05-11 08:30:00', NULL, 15000.0, 230.0, 'HORAIRE', NOW()),

-- Historical Completed Cases (Opened & Closed in Jan, Feb, Mar, Apr 2026)
(1013, 'DOS-2026-013', 'Contrat de Travail Directeur Général NovaTech', 'Rédaction du contrat de travail de M. Martin avec clause de non-concurrence renforcée.', 21, '2', 'SOC', 'MOYENNE', 'TERMINE', '2026-01-10 09:00:00', '2026-01-28 18:00:00', 3500.0, 240.0, 'FORFAIT', NOW()),
(1014, 'DOS-2026-014', 'Cession de parts sociales BatiBuild', 'Accompagnement cession minoritaire 10% des parts de BatiBuild SARL.', 22, '1', 'AFF', 'HAUTE', 'TERMINE', '2026-02-01 10:00:00', '2026-02-25 17:30:00', 7000.0, 250.0, 'HORAIRE', NOW()),
(1015, 'DOS-2026-015', 'Arbitrage Immobilier Luxe Global', 'Arbitrage locatif commercial concernant le flagship store des Champs-Élysées.', 23, '3', 'IMM', 'HAUTE', 'TERMINE', '2026-01-15 14:00:00', '2026-03-12 12:00:00', 18000.0, 220.0, 'HORAIRE', NOW()),
(1016, 'DOS-2026-016', 'Rupture Conventionnelle CHU Dijon', 'Accompagnement dans la rupture conventionnelle d''un médecin chef de service.', 42, '4', 'SOC', 'BASSE', 'TERMINE', '2026-03-05 09:30:00', '2026-03-29 17:00:00', 2500.0, 180.0, 'FORFAIT', NOW()),
(1017, 'DOS-2026-017', 'Contestation Fiscale EcoGreen', 'Contrôle fiscal portant sur les subventions écologiques reçues en 2024.', 31, '2', 'FIS', 'HAUTE', 'TERMINE', '2026-02-12 10:00:00', '2026-04-18 16:00:00', 12000.0, 250.0, 'HORAIRE', NOW()),
(1018, 'DOS-2026-018', 'Contrats Sponsoring David Beckham', 'Rédaction de contrats de sponsoring pour la promotion d''une marque de cosmétiques.', 20, '1', 'AFF', 'MOYENNE', 'TERMINE', '2026-03-10 11:00:00', '2026-04-25 15:00:00', 10000.0, 300.0, 'HORAIRE', NOW()),
(1019, 'DOS-2026-019', 'Référé Suspension Mairie Bordeaux', 'Action en référé contre une décision de fermeture d''un établissement de nuit.', 41, '3', 'CIV', 'HAUTE', 'TERMINE', '2026-04-02 09:00:00', '2026-04-20 18:00:00', 5000.0, 200.0, 'FORFAIT', NOW()),
(1020, 'DOS-2026-020', 'Bail Commercial Cabinet Médical', 'Rédaction d''un bail commercial pour cabinet médical partagé.', 12, '4', 'IMM', 'BASSE', 'TERMINE', '2026-04-05 14:00:00', '2026-04-28 17:00:00', 1800.0, 180.0, 'FORFAIT', NOW()),

-- Ongoing & Suspended Matters from late 2025 / early 2026
(1021, 'DOS-2025-055', 'Défense Pénale Nicolas Sarkozy', 'Accompagnement pénal dans l''affaire dite des écoutes téléphoniques.', 16, '1', 'PEN', 'URGENTE', 'EN_COURS', '2025-10-15 09:00:00', NULL, 150000.0, 350.0, 'HORAIRE', NOW()),
(1022, 'DOS-2025-088', 'Projet Éolien Offshore SolarGroup', 'Due diligence environnementale et autorisations préfectorales pour parc éolien.', 26, '2', 'ENV', 'HAUTE', 'EN_COURS', '2025-12-01 10:00:00', NULL, 75000.0, 260.0, 'HORAIRE', NOW()),
(1023, 'DOS-2026-021', 'Litige Brevet Logiciel NovaTech', 'Procédure en contrefaçon de brevet logiciel engagée par un concurrent américain.', 21, '1', 'AFF', 'HAUTE', 'EN_COURS', '2026-02-15 08:30:00', NULL, 40000.0, 280.0, 'HORAIRE', NOW()),
(1024, 'DOS-2026-022', 'Bail commercial Port Autonome Le Havre', 'Renégociation globale du bail de concession industrielle du quai n°4.', 43, '3', 'IMM', 'MOYENNE', 'EN_COURS', '2026-03-01 11:00:00', NULL, 18000.0, 210.0, 'HORAIRE', NOW()),
(1025, 'DOS-2026-023', 'Contentieux Prud''homme Moreau vs. IT-Solutions', 'Défense salariée suite à un licenciement abusif pour faute grave présumée.', 17, '4', 'SOC', 'HAUTE', 'SUSPENDU', '2026-01-20 14:00:00', NULL, 5000.0, 190.0, 'FORFAIT', NOW()),
(1026, 'DOS-2026-024', 'Arbitrage International Red Alert', 'Arbitrage commercial concernant le blocage de conteneurs de fret maritime.', 25, '2', 'INT', 'URGENTE', 'SUSPENDU', '2026-03-15 09:00:00', NULL, 80000.0, 300.0, 'HORAIRE', NOW()),
(1027, 'DOS-2026-025', 'Acquisition Hôtel Particulier Emma Watson', 'Accompagnement dans l''acquisition d''un hôtel particulier classé historique à Paris.', 19, '3', 'IMM', 'HAUTE', 'EN_COURS', '2026-04-10 10:00:00', NULL, 35000.0, 280.0, 'HORAIRE', NOW()),
(1028, 'DOS-2026-026', 'Défense Référé Conseil Régional AURA', 'Défense contre un recours en annulation d''un marché public de transports scolaires.', 44, '2', 'CIV', 'MOYENNE', 'EN_COURS', '2026-04-15 15:30:00', NULL, 15000.0, 220.0, 'HORAIRE', NOW()),
(1029, 'DOS-2026-027', 'Contrat Édition Art & Culture Paris', 'Rédaction du protocole d''accord pour l''édition d''une collection d''œuvres d''art.', 34, '4', 'AFF', 'BASSE', 'EN_COURS', '2026-04-20 11:00:00', NULL, 4000.0, 180.0, 'FORFAIT', NOW()),
(1030, 'DOS-2026-028', 'Défense Responsabilité Civile Sauvetage Finistère', 'Mise en cause de la responsabilité de l''association suite à un accident de bateau.', 35, '3', 'CIV', 'HAUTE', 'EN_COURS', '2026-04-22 09:30:00', NULL, 9000.0, 200.0, 'HORAIRE', NOW()),
(1031, 'DOS-2026-029', 'Restructuration Université Sorbonne', 'Conseil juridique sur la fusion de plusieurs départements de recherche.', 45, '1', 'EDU', 'MOYENNE', 'EN_COURS', '2026-04-28 14:00:00', NULL, 25000.0, 250.0, 'HORAIRE', NOW()),
(1032, 'DOS-2026-030', 'Succession Complexe Michel Rodriguez', 'Règlement d''un litige successoral portant sur des biens immobiliers situés en Espagne.', 13, '4', 'CIV', 'HAUTE', 'EN_COURS', '2026-03-20 10:30:00', NULL, 12000.0, 210.0, 'HORAIRE', NOW());

-- ============================================================================
-- 13. DOSSIER INTERVENANTS
-- ============================================================================
INSERT INTO dossier_intervenants (dossier_id, intervenant_id) VALUES 
(1001, '2'), (1001, '5'), (1002, '1'), (1002, '5'),
(1003, '1'), (1003, '3'), (1005, '4'), (1006, '1'),
(1009, '1'), (1009, '3'), (1012, '3'), (1012, '5'),
(1015, '1'), (1017, '5'), (1021, '3'), (1021, '4'),
(1022, '1'), (1023, '5'), (1026, '3'), (1027, '1'),
(1031, '2'), (1032, '5'), (1032, '3');

-- ============================================================================
-- 14. NOTES DE DOSSIER (Strategic Insights & Audit Memos)
-- ============================================================================
INSERT INTO notes (dossier_id, auteur_id, title, description, category_id, created_at, updated_at) VALUES 
(1001, 1, 'Analyses des Clauses de Clic d''Actionnaire', 'Attention particulière sur la clause de liquidation préférentielle demandée par le fonds leader. Nous devons limiter la préférence à 1x non-participante.', 1, NOW() - INTERVAL 15 DAY, NOW()),
(1001, 2, 'Validation UBO pour la levée', 'Les documents d''identification de Thierry Martin sont validés. Les vérifications de Sylvie Martin sont en cours.', 3, NOW() - INTERVAL 10 DAY, NOW()),
(1002, 3, 'Preuves Retards Chantier', 'Le constat d''huissier de justice du 12 mai démontre clairement l''abandon temporaire du chantier par le sous-traitant. Excellent point pour notre référé.', 2, NOW() - INTERVAL 5 DAY, NOW()),
(1003, 2, 'Réticences des Propriétaires Fonciers', 'Plusieurs parcelles sont en indivision complexe. La négociation amiable sera difficile, l''expropriation publique semble inévitable.', 1, NOW() - INTERVAL 4 DAY, NOW()),
(1004, 4, 'Stratégie Audience Roulage', 'Alexis Vidal a un casier vierge de toute infraction routière depuis 5 ans. Demander la clémence et une dispense d''inscription B2.', 2, NOW() - INTERVAL 3 DAY, NOW()),
(1005, 1, 'Premiers Retours Audit CHU', 'Les dossiers des patients ne sont pas chiffrés sur le serveur local. Risque majeur d''infraction RGPD à notifier immédiatement à la DSI.', 1, NOW() - INTERVAL 1 DAY, NOW()),
(1006, 2, 'Dialogue Social NovaTech', 'Le CSE se montre ouvert aux mesures de reclassement si le budget formation est abondé de 20%.', 3, NOW() - INTERVAL 12 DAY, NOW()),
(1007, 1, 'Signature Contrat Luxe Global', 'Le contrat a été paraphé et signé électroniquement par toutes les parties. Fin de mission sur ce dossier.', 3, NOW() - INTERVAL 2 DAY, NOW()),
(1009, 2, 'Montage Holding Luxembourg', 'Validation de la structure de holding. Les conditions d''exonération de retenue à la source semblent parfaitement applicables.', 1, NOW() - INTERVAL 6 DAY, NOW()),
(1021, 1, 'Audience d''instruction pénale Nicolas Sarkozy', 'La défense a soulevé plusieurs nullités de procédure sur les transcriptions d''écoutes téléphoniques.', 2, NOW() - INTERVAL 45 DAY, NOW() - INTERVAL 45 DAY),
(1022, 2, 'Validation Étude Impact Environnemental', 'L''enquête publique s''est clôturée avec un avis favorable sous réserves concernant les oiseaux migrateurs.', 4, NOW() - INTERVAL 25 DAY, NOW() - INTERVAL 25 DAY),
(1023, 1, 'Jurisprudence Brevet Américain', 'Analyse du brevet concurrent: la revendication 12 semble invalide pour défaut d''activité inventive.', 4, NOW() - INTERVAL 18 DAY, NOW() - INTERVAL 18 DAY),
(1027, 3, 'Visite des Monuments Historiques', 'L''architecte en chef a validé la faisabilité des travaux de rénovation de la toiture sans altération du monument.', 1, NOW() - INTERVAL 8 DAY, NOW() - INTERVAL 8 DAY);

-- ============================================================================
-- 15. TÂCHES DE DOSSIER (Action items: Completed, In Progress, To Do)
-- ============================================================================
INSERT INTO tasks (id, dossier_id, titre, description, category_id, status_id, priorite, date_echeance, is_completed, created_at, created_by_id, estimated_time_minutes) VALUES 
(1, 1001, 'Finaliser le projet de pacte d''actionnaires', 'Intégrer les retours du conseil du fonds d''investissement sur les clauses de drag-along.', 1, 2, 'URGENTE', '2026-05-20 18:00:00', false, NOW(), 1, 240),
(2, 1001, 'Vérifier la déclaration de conformité AML', 'Analyser les passeports et déclarations UBO de tous les souscripteurs.', 5, 2, 'HAUTE', '2026-05-22 12:00:00', false, NOW(), 1, 120),
(3, 1002, 'Rédiger l''assignation en référé provision', 'Rédiger les conclusions basées sur le rapport de l''expert immobilier.', 1, 1, 'HAUTE', '2026-05-25 10:00:00', false, NOW(), 3, 180),
(4, 1003, 'Déposer le mémoire d''expropriation', 'Dépôt auprès du Greffe du Tribunal Judiciaire de Bordeaux.', 5, 3, 'MOYENNE', '2026-05-15 16:00:00', true, NOW(), 2, 90),
(5, 1004, 'Préparer la plaidoirie pénale', 'Faire des recherches de jurisprudence sur l''annulation des contrôles de vitesse radar.', 2, 2, 'HAUTE', '2026-05-19 14:00:00', false, NOW(), 4, 300),
(6, 1005, 'Établir la cartographie des risques de données', 'Étape préliminaire indispensable pour l''audit RGPD du CHU de Dijon.', 3, 1, 'MOYENNE', '2026-05-30 18:00:00', false, NOW(), 1, 480),
(7, 1006, 'Rédiger la convocation de la première réunion CSE', 'Projet de document à soumettre pour relecture au client.', 1, 3, 'HAUTE', '2026-05-05 17:00:00', true, NOW(), 2, 60),
(8, 1009, 'Demander le rescrit fiscal à l''administration', 'Soumission de la demande formelle d''accord préalable.', 5, 2, 'URGENTE', '2026-05-24 12:00:00', false, NOW(), 2, 360),
(9, 1010, 'Assigner en contestation de commandement', 'Signifier par voie d''huissier de justice la contestation.', 1, 2, 'URGENTE', '2026-05-18 09:00:00', false, NOW(), 4, 120),
-- Completed historic tasks for closed cases
(10, 1013, 'Rédiger contrat de travail DG', 'Rédiger version finale CDI.', 1, 3, 'HAUTE', '2026-01-20 18:00:00', true, NOW() - INTERVAL 120 DAY, 2, 120),
(11, 1014, 'Acte de cession de parts', 'Rédiger les protocoles de cession.', 1, 3, 'HAUTE', '2026-02-20 18:00:00', true, NOW() - INTERVAL 100 DAY, 1, 180),
(12, 1015, 'Dépôt conclusions arbitrage', 'Remettre le dossier complet au collège arbitral.', 5, 3, 'URGENTE', '2026-03-05 12:00:00', true, NOW() - INTERVAL 80 DAY, 3, 240),
(13, 1017, 'Mémoire de réponse fisc', 'Rédiger la réponse motivée suite à notification de redressement.', 5, 3, 'HAUTE', '2026-04-10 18:00:00', true, NOW() - INTERVAL 40 DAY, 2, 300),
(14, 1021, 'Rédiger mémoire nullité écoutes', 'Mémoire de nullités pour la chambre de l''instruction.', 1, 2, 'URGENTE', '2026-05-28 18:00:00', false, NOW() - INTERVAL 30 DAY, 1, 600),
(15, 1022, 'Rapport conformité éolienne', 'Due diligence réglementaire.', 3, 2, 'MOYENNE', '2026-05-25 18:00:00', false, NOW() - INTERVAL 15 DAY, 2, 400);

-- ============================================================================
-- 16. TÂCHES ASSIGNÉES
-- ============================================================================
INSERT INTO task_assignees (task_id, user_id) VALUES 
(1, 1), (1, 3), (2, 5), (3, 3), (3, 5), (4, 2),
(5, 4), (6, 1), (6, 5), (7, 2), (7, 5), (8, 2),
(8, 3), (9, 4), (10, 2), (11, 1), (12, 3), (13, 2),
(14, 1), (14, 3), (15, 2), (15, 5);

-- ============================================================================
-- 17. EVENEMENTS DU DOSSIER (Matter activities - timeline history)
-- ============================================================================
INSERT INTO matter_activities (id, dossier_id, author, action, target_type, target_id, description, created_at) VALUES 
-- Active matters timeline
(1, 1001, 'Jean Dupont', 'CREATION', 'DOSSIER', 1001, 'Ouverture du dossier de levée de fonds NovaTech SAS', '2026-05-02 09:05:00'),
(2, 1001, 'Lucas Martin', 'DOCUMENT_ADDED', 'DOCUMENT', 101, 'Réception et liaison du document "Statuts NovaTech.pdf"', '2026-05-02 11:20:00'),
(3, 1001, 'Jean Dupont', 'TASK_ADDED', 'TASK', 1, 'Création de la tâche de finalisation du projet de pacte', '2026-05-02 14:30:00'),
(4, 1002, 'Pierre Simon', 'CREATION', 'DOSSIER', 1002, 'Ouverture du contentieux BatiBuild contre sous-traitant', '2026-05-05 10:15:00'),
(5, 1002, 'Pierre Simon', 'NOTE_ADDED', 'NOTE', 3, 'Enregistrement de la note de stratégie sur l''abandon de chantier', '2026-05-05 16:45:00'),
(6, 1003, 'Marie Laurent', 'CREATION', 'DOSSIER', 1003, 'Ouverture du dossier d''acquisition foncière Bordeaux', '2026-05-10 11:40:00'),
(7, 1003, 'Marie Laurent', 'TASK_COMPLETED', 'TASK', 4, 'Clôture de la tâche de dépôt du mémoire d''expropriation', '2026-05-15 16:05:00'),
(8, 1006, 'Marie Laurent', 'STATUS_CHANGED', 'DOSSIER', 1006, 'Changement du statut du dossier de NOUVEAU à EN_COURS', '2026-05-03 14:10:00'),
(9, 1007, 'Jean Dupont', 'CLOSURE', 'DOSSIER', 1007, 'Clôture et archivage du dossier Luxe Global après signature générale', '2026-05-15 17:15:00'),
-- Older history timelines (Jan, Feb, Mar, Apr 2026)
(10, 1013, 'Marie Laurent', 'CREATION', 'DOSSIER', 1013, 'Ouverture du dossier contrat DG NovaTech', '2026-01-10 09:10:00'),
(11, 1013, 'Marie Laurent', 'TASK_COMPLETED', 'TASK', 10, 'Contrat rédigé et validé par le conseil d''administration', '2026-01-25 15:30:00'),
(12, 1013, 'Marie Laurent', 'CLOSURE', 'DOSSIER', 1013, 'Dossier clos après signature effective du contrat de travail', '2026-01-28 18:05:00'),
(13, 1014, 'Jean Dupont', 'CREATION', 'DOSSIER', 1014, 'Ouverture dossier de cession de parts BatiBuild', '2026-02-01 10:15:00'),
(14, 1014, 'Jean Dupont', 'TASK_COMPLETED', 'TASK', 11, 'Acte de cession signé électroniquement par les cédants/cessionnaires', '2026-02-25 17:35:00'),
(15, 1015, 'Pierre Simon', 'CREATION', 'DOSSIER', 1015, 'Ouverture de l''arbitrage locatif Champs-Élysées', '2026-01-15 14:10:00'),
(16, 1015, 'Pierre Simon', 'TASK_COMPLETED', 'TASK', 12, 'Dépôt des conclusions finales d''arbitrage', '2026-03-05 12:15:00'),
(17, 1015, 'Pierre Simon', 'CLOSURE', 'DOSSIER', 1015, 'Dossier clos suite au rendu de la sentence arbitrale favorable', '2026-03-12 12:10:00'),
(18, 1017, 'Marie Laurent', 'CREATION', 'DOSSIER', 1017, 'Ouverture dossier contestation fiscale EcoGreen', '2026-02-12 10:15:00'),
(19, 1017, 'Marie Laurent', 'TASK_COMPLETED', 'TASK', 13, 'Réponse motivée déposée aux services fiscaux', '2026-04-10 18:05:00'),
(20, 1017, 'Marie Laurent', 'CLOSURE', 'DOSSIER', 1017, 'Dossier clos suite à l''abandon total des redressements fiscaux', '2026-04-18 16:05:00');

-- ============================================================================
-- 18. APPOINTEMENTS DE L'AGENDA (Hearings, Meetings, Calls - 50+ spread from Jan to Jul 2026)
-- ============================================================================
INSERT INTO appointements (id, title, client_case, client_id, dossier_id, date, time, end_time, location, status) VALUES 
-- Historic Appointments (Jan, Feb, Mar, Apr 2026)
(11, 'RDV Lancement Contrat DG', 'NovaTech - Thierry Martin', 21, 1013, '2026-01-12', '10:00', '11:30', 'Cabinet Avo - Salon Rouge', 'Standard'),
(12, 'Call de réalignement Pacte DG', 'Discussion clauses spécifiques contractuelles', 21, 1013, '2026-01-20', '15:00', '16:00', 'Téléphone / Teams', 'Standard'),
(13, 'RDV Cession BatiBuild', 'Négociations cessionnaires et banque', 22, 1014, '2026-02-05', '14:00', '16:30', 'Cabinet Avo - Grande Salle', 'Standard'),
(14, 'Signature acte de cession', 'Cession BatiBuild', 22, 1014, '2026-02-25', '16:00', '17:30', 'Cabinet Avo - Bureau Jean Dupont', 'Standard'),
(15, 'Première session arbitrage', 'Luxe Global - Flagship Champs-Élysées', 23, 1015, '2026-01-22', '09:30', '13:00', 'Chambre de Commerce Internationale (CCI)', 'Urgent'),
(16, 'Seconde session arbitrage', 'Présentation des mémoires en réplique', 23, 1015, '2026-02-18', '09:30', '13:00', 'Chambre de Commerce Internationale (CCI)', 'Urgent'),
(17, 'Plaidoirie Finale Arbitrage', 'Débats finaux devant le tribunal arbitral', 23, 1015, '2026-03-05', '09:00', '12:00', 'Chambre de Commerce Internationale (CCI)', 'Urgent'),
(18, 'Entretien préalable CHU Dijon', 'Rupture conventionnelle', 42, 1016, '2026-03-10', '14:30', '16:00', 'CHU Dijon - DRH', 'Standard'),
(19, 'RDV Préparatoire Fisc EcoGreen', 'Audit comptable subventions', 31, 1017, '2026-02-20', '10:00', '12:00', 'Cabinet Avo - Bureau Marie Laurent', 'Standard'),
(20, 'Négociation Contrôle Fiscal EcoGreen', 'Présentation des justificatifs d''achats écologiques', 31, 1017, '2026-03-15', '14:00', '17:00', 'Centre des Finances Publiques - Strasbourg', 'Urgent'),
(21, 'Call de cadrage David Beckham', 'Contrats cosmétiques', 20, 1018, '2026-03-12', '16:00', '17:00', 'Appel Vidéo Zoom', 'Standard'),
(22, 'Signature Contrats Sponsoring', 'Beckham Global Brand', 20, 1018, '2026-04-25', '10:00', '11:30', 'Visioconférence Internationale', 'Standard'),
(23, 'Audience Référé Mairie Bordeaux', 'Contestation arrêté de fermeture nocturne', 41, 1019, '2026-04-12', '10:00', '12:00', 'Tribunal Administratif de Bordeaux', 'Urgent'),
(24, 'RDV Signature Bail Sophie Dubois', 'Bail commercial cabinet médical', 12, 1020, '2026-04-28', '15:00', '16:00', 'Cabinet Avo - Salon Blanc', 'Standard'),

-- Active Month (May 2026) Appointments (Daily calendar populating)
(1, 'Audience Référé BatiBuild', 'Contre sous-traitant (Référé Provision)', 22, 1002, '2026-05-26', '10:00', '12:00', 'Tribunal Judiciaire de Lille - Salle 4', 'Urgent'),
(2, 'Closing Levée de Fonds NovaTech', 'Signature physique de tous les investisseurs', 21, 1001, '2026-05-28', '14:30', '18:00', 'Salle de Conférence Cabinet Avo', 'Standard'),
(3, 'Audience correctionnelle Alexis Vidal', 'Plaidoirie défense délit routier', 11, 1004, '2026-05-20', '09:00', '11:30', 'Tribunal Correctionnel de Paris - Ch 4', 'Urgent'),
(4, 'RDV Conseil Municipal Bordeaux', 'Discussion expropriations foncières', 41, 1003, '2026-05-19', '15:00', '17:00', 'Mairie de Bordeaux', 'Standard'),
(5, 'Réunion d''évaluation RGPD CHU Dijon', 'Présentation des failles de sécurité majeures', 42, 1005, '2026-05-27', '10:30', '12:30', 'CHU Dijon - Bâtiment Administratif', 'Standard'),
(6, 'RDV de cadrage Rescrit Alpha Finance', 'Négociations directes avec le fisc', 24, 1009, '2026-05-22', '11:00', '13:00', 'Direction des Services Fiscaux Paris', 'Urgent'),
(7, 'Première réunion CSE NovaTech', 'Négociation du calendrier de licenciement collectif', 21, 1006, '2026-05-05', '14:00', '16:00', 'Siège Social NovaTech, Lyon', 'Standard'),
(8, 'Appel d''alignement Douanes Rouen', 'Discussion arbitrage règlement transitaire', 43, 1012, '2026-05-25', '16:30', '17:30', 'Visioconférence Teams', 'Standard'),
(9, 'Consultation Initiale Kurt Muller', 'Nouveau client - Droit immobilier commercial', 14, NULL, '2026-05-21', '14:00', '15:00', 'Cabinet Avo - Bureau Pierre Simon', 'Standard'),
(10, 'Réunion UBO Secourisme Sport Active', 'Clarification de la structure associative', 33, 1008, '2026-05-06', '09:00', '10:00', 'Cabinet Avo - Visioconférence Zoom', 'Standard'),
(25, 'Conférence de Procédure Nicolas Sarkozy', 'Instruction pénale de fond', 16, 1021, '2026-05-24', '14:00', '16:00', 'Palais de Justice de Paris - Bureau du Juge', 'Urgent'),
(26, 'Table Ronde Publique Parc Éolien', 'Débats avec les riverains et associations locales', 26, 1022, '2026-05-29', '18:00', '20:30', 'Mairie de Berlin-Mitte', 'Standard'),
(27, 'Call d''alignement Brevet NovaTech', 'Alignement avec les experts en propriété intellectuelle', 21, 1023, '2026-05-23', '09:00', '10:30', 'Visioconférence Teams', 'Standard'),
(28, 'RDV Cadastre Port Le Havre', 'Bornage technique de la concession industrielle', 43, 1024, '2026-05-25', '10:00', '12:00', 'Port Autonome du Havre', 'Standard'),
(29, 'RDV Notaire Emma Watson', 'Négociations promesse d''achat', 19, 1027, '2026-05-26', '15:00', '16:30', 'Étude Notariale Paris Rive Gauche', 'Standard'),
(30, 'Audience Tribunal Judiciaire Michel Rodriguez', 'Débats successoraux', 13, 1032, '2026-05-20', '14:00', '16:00', 'Tribunal Judiciaire de Lille - Salle 3', 'HAUTE'),

-- Future Appointments (June, July 2026)
(31, 'Audience de plaidoirie au fond BatiBuild', 'Débats finaux sur le fond du litige de chantier', 22, 1002, '2026-06-15', '10:00', '13:00', 'Tribunal de Commerce de Lille', 'Urgent'),
(32, 'Présentation du rapport d''audit final CHU Dijon', 'Présentation générale devant le directoire', 42, 1005, '2026-06-18', '09:30', '12:30', 'CHU Dijon - Amphithéâtre Central', 'Standard'),
(33, 'Audience Tribunal Judiciaire Nicolas Sarkozy', 'Audience solennelle d''ouverture des débats', 16, 1021, '2026-06-22', '09:00', '17:00', 'Palais de Justice de Paris - Salle des pas perdus', 'Urgent'),
(34, 'RDV d''instruction Prud''homale Julie Moreau', 'Bureau de conciliation et d''orientation (BCO)', 17, 1025, '2026-06-05', '14:00', '15:30', 'Conseil des Prud''hommes de Lyon', 'Standard'),
(35, 'Audience d''arbitrage international Red Alert', 'Première journée d''audiences testimoniales', 25, 1026, '2026-07-06', '09:00', '18:00', 'Chambre de Commerce de Genève', 'Urgent'),
(36, 'Seconde journée d''arbitrage Red Alert', 'Seconde journée d''audiences testimoniales', 25, 1026, '2026-07-07', '09:00', '18:00', 'Chambre de Commerce de Genève', 'Urgent'),
(37, 'RDV Conseil d''administration Sorbonne', 'Arbitrages finaux sur la restructuration', 45, 1031, '2026-06-12', '10:00', '13:00', 'Sorbonne - Salon d''honneur', 'Standard'),
(38, 'Call Client Hebdomadaire NovaTech', 'Suivi hebdomadaire des litiges de brevets', 21, 1023, '2026-06-01', '11:00', '12:00', 'Visioconférence Teams', 'Standard'),
(39, 'Call Client Hebdomadaire NovaTech', 'Suivi hebdomadaire des litiges de brevets', 21, 1023, '2026-06-08', '11:00', '12:00', 'Visioconférence Teams', 'Standard'),
(40, 'Call Client Hebdomadaire NovaTech', 'Suivi hebdomadaire des litiges de brevets', 21, 1023, '2026-06-15', '11:00', '12:00', 'Visioconférence Teams', 'Standard');

-- ============================================================================
-- 19. DOCUMENTS (Category templates and actual case records)
-- ============================================================================
-- 19.1 GLOBAL CABINET TEMPLATES (typeDocument = 'MODEL')
INSERT INTO documents (id, nom_fichier, type_document, title, name, label, description, tags, filename, url_stockage, date_upload, est_valide, file_data) VALUES 
(501, 'modele_contrat_travail_salarie.docx', 'MODEL', 'Modèle Contrat de Travail CDI Standard', 'modele-cdi', 'CDI Standard', 'Modèle type de contrat de travail à durée indéterminée pour cadres et employés.', 'RH, Contrat, CDI', 'modele_contrat_travail_salarie.docx', '/models/cdi.docx', NOW(), true, 0x54657374426c6f62),
(502, 'modele_pacte_actionnaires.docx', 'MODEL', 'Modèle Pacte d''Actionnaires Standard', 'modele-pacte', 'Pacte Actionnaires', 'Modèle équilibré de pacte d''actionnaires adapté pour start-ups et investisseurs.', 'Corporate, Pacte, Venture', 'modele_pacte_actionnaires.docx', '/models/pacte.docx', NOW(), true, 0x54657374426c6f62),
(503, 'modele_mise_en_demeure.docx', 'MODEL', 'Modèle Lettre de Mise en Demeure Référé', 'modele-med', 'Mise en Demeure', 'Modèle de mise en demeure formelle avant recours judiciaire en cas d''inexécution.', 'Contentieux, Référé', 'modele_mise_en_demeure.docx', '/models/med.docx', NOW(), true, 0x54657374426c6f62),
(504, 'modele_nda_fr_en.docx', 'MODEL', 'Modèle Accord de Confidentialité Bilingue', 'modele-nda', 'NDA Bilingue', 'Accord de non-divulgation (NDA) réciproque rédigé en français et en anglais.', 'Contrat, NDA, Corporate', 'modele_nda_fr_en.docx', '/models/nda.docx', NOW(), true, 0x54657374426c6f62);

-- 19.2 ACTUAL CLIENT AND DOSSIER DOCUMENTS (typeDocument = 'DOSSIER' / 'CLIENT')
INSERT INTO documents (id, nom_fichier, type_document, title, name, label, description, tags, filename, url_stockage, date_upload, est_valide, client_id, dossier_id) VALUES 
(101, 'statuts_novatech_signes.pdf', 'DOSSIER', 'Statuts constitutifs de NovaTech SAS', 'statuts-novatech', 'Statuts NovaTech', 'Version signée le 12 décembre 2024 devant notaire des statuts officiels.', 'Statuts, Corporate', 'statuts_novatech_signes.pdf', '/docs/clients/21/statuts.pdf', NOW(), true, 21, 1001),
(102, 'kbis_novatech_2026.pdf', 'DOSSIER', 'Extrait KBIS NovaTech du 01/05/2026', 'kbis-novatech', 'KBIS Récent', 'Extrait d''immatriculation datant de moins de 3 mois pour conformité réglementaire.', 'KBIS, Corporate', 'kbis_novatech_2026.pdf', '/docs/clients/21/kbis.pdf', NOW(), true, 21, 1001),
(103, 'constat_huissier_batibuild.pdf', 'DOSSIER', 'Procès-verbal de constat d''abandon de chantier', 'constat-huissier-batibuild', 'Constat Huissier', 'Constat dressé par SCP Lemoine et associés démontrant l''état du chantier abandonné.', 'Preuve, Contentieux', 'constat_huissier_batibuild.pdf', '/docs/clients/22/constat.pdf', NOW(), true, 22, 1002),
(104, 'compromis_vente_bordeaux.pdf', 'DOSSIER', 'Compromis de vente foncier signé', 'compromis-bordeaux', 'Compromis Foncier', 'Copie signée du compromis relatif à la parcelle cadastrée section AB n°12.', 'Immobilier, Contrat', 'compromis_vente_bordeaux.pdf', '/docs/clients/41/compromis.pdf', NOW(), true, 41, 1003),
(105, 'cni_alexis_vidal.pdf', 'CLIENT', 'Carte Nationale d''Identité Alexis Vidal', 'cni-vidal', 'CNI Alexis Vidal', 'Carte d''identité française en cours de validité pour conformité KYC.', 'KYC, Identité', 'cni_alexis_vidal.pdf', '/docs/clients/11/cni.pdf', NOW(), true, 11, NULL),
(106, 'memoire_defense_sarkozy.pdf', 'DOSSIER', 'Mémoire de nullités en défense - Écoutes', 'memoire-sarkozy', 'Mémoire Nullités', 'Document rédigé par Me Dupont invoquant les nullités d''écoutes téléphoniques.', 'Pénal, Procédure', 'memoire_defense_sarkozy.pdf', '/docs/clients/16/memoire.pdf', NOW(), true, 16, 1021),
(107, 'etude_impact_solargroup.pdf', 'DOSSIER', 'Étude d''impact environnemental - Parc Éolien', 'etude-solargroup', 'Étude Impact', 'Rapport complet d''étude d''impact sur la faune et la flore locales.', 'Environnement, Rapport', 'etude_impact_solargroup.pdf', '/docs/clients/26/etude.pdf', NOW(), true, 26, 1022);

-- ============================================================================
-- 20. DOSSIER DOCUMENTS LINK (Join Table: dossier_documents)
-- ============================================================================
INSERT INTO dossier_documents (dossier_id, document_id) VALUES 
(1001, 101), (1001, 102), (1002, 103), (1003, 104),
(1021, 106), (1022, 107);

-- ============================================================================
-- 21. FORM CONFIGURATIONS (FormConfig, FieldConfig, FieldOption)
-- ============================================================================
-- 21.1 FORM_CONFIG
INSERT INTO form_config (id, type, target_client_type, name, title, description, creation_date, last_update_date) VALUES
('form-001', 'INDULGENCE', 'PERSONNE', 'kyc-person-std', 'KYC Standard - Personne Physique', 'Vigilance standard pour clients particuliers.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-002', 'INDULGENCE', 'SOCIETE', 'kyc-company-std', 'KYC Standard - Personne Morale', 'Vigilance standard pour entreprises.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-003', 'INDULGENCE', 'INSTITUTION', 'kyc-institution', 'Vigilance Institutions', 'Vérification entités gouvernementales.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-004', 'INDULGENCE', 'ASSOCIATION', 'kyc-association', 'Vigilance Associations', 'Contrôle organismes sans but lucratif.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-005', 'INDULGENCE', 'PERSONNE', 'ppe-detailed', 'PPE Détaillée', 'Contrôle renforcé pour PPE.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-006', 'INDULGENCE', 'SOCIETE', 'ubo-declaration', 'Déclaration UBO', 'Identification des bénéficiaires effectifs.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-007', 'INDULGENCE', 'PERSONNE', 'high-risk-res', 'Haut Risque Résidence', 'Juridictions sensibles.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-008', 'INDULGENCE', 'SOCIETE', 'offshore-audit', 'Audit Offshore', 'Analyse structures offshore.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-009', 'INDULGENCE', 'ASSOCIATION', 'funding-ngo', 'Source Fonds NGO', 'Origine des dons.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-010', 'INDULGENCE', 'PERSONNE', 'wealth-hnwi', 'Fortune HNWI', 'Patrimoine clients fortunés.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 21.2 FIELD_CONFIG
INSERT INTO field_config (id, name, type, label, required, error_message, placeholder, form_config_id) VALUES
('field-001-1', 'full_name', 'text', 'Nom Complet', true, 'Champ requis', 'Entrez votre nom', 'form-001'),
('field-001-2', 'birth_date', 'text', 'Date de Naissance', true, 'Date requise', 'JJ/MM/AAAA', 'form-001'),
('field-001-3', 'id_upload', 'file', 'Pièce d''identité', true, 'Fichier requis', NULL, 'form-001'),
('field-002-1', 'company_name', 'text', 'Raison Sociale', true, 'Champ requis', 'Nom de l''entreprise', 'form-002'),
('field-002-2', 'tax_id', 'text', 'Numéro de TVA', false, NULL, 'Ex: FR123456789', 'form-002'),
('field-002-3', 'legal_status', 'select', 'Forme Juridique', true, 'Sélectionnez une option', NULL, 'form-002'),
('field-005-1', 'is_ppe', 'radio', 'Êtes-vous une PPE ?', true, 'Sélection obligatoire', NULL, 'form-005'),
('field-005-2', 'ppe_role', 'text', 'Fonction occupée', false, NULL, 'Ex: Ministre', 'form-005'),
('field-006-1', 'ubo_count', 'number', 'Nombre de bénéficiaires', true, 'Minimum 1', 'Ex: 1', 'form-006'),
-- Complex Form 007 fields (Haut Risque Résidence)
('field-007-1', 'source_of_wealth', 'select', 'Source de la Fortune', true, 'Origine obligatoire', NULL, 'form-007'),
('field-007-2', 'wealth_details', 'text', 'Précision sur l''origine', false, NULL, 'Détaillez la provenance', 'form-007'),
('field-007-3', 'jurisdiction_reason', 'text', 'Raison de la résidence', true, 'Raison obligatoire', 'Pourquoi cette juridiction ?', 'form-007'),
('field-007-4', 'annual_income', 'number', 'Revenu Annuel (€)', false, NULL, 'Ex: 500000', 'form-007'),
('field-007-5', 'expected_volume', 'number', 'Volume estimé (€/an)', true, 'Volume obligatoire', 'Volume de transactions', 'form-007'),
('field-007-6', 'high_risk_country', 'select', 'Pays Concerné', true, 'Sélectionnez le pays', NULL, 'form-007'),
('field-007-7', 'sanctions_check', 'radio', 'Sanction Check validé ?', true, 'Vérification obligatoire', NULL, 'form-007'),
('field-007-8', 'sanctions_details', 'text', 'Détails Sanctions', false, NULL, 'Observations...', 'form-007'),
-- Complex Form 008 fields (Audit Offshore)
('field-008-1', 'offshore_jurisdiction', 'select', 'Juridiction Offshore', true, 'Juridiction obligatoire', NULL, 'form-008'),
('field-008-2', 'offshore_reg_number', 'text', 'N° d''enregistrement', true, 'Numéro obligatoire', 'N° de registre', 'form-008'),
('field-008-3', 'has_intermediary', 'radio', 'Présence Fiduciary/Intermédiaire', true, 'Sélection obligatoire', NULL, 'form-008'),
('field-008-4', 'intermediary_name', 'text', 'Nom Intermédiaire', false, NULL, 'Nom du cabinet', 'form-008'),
('field-008-5', 'layers_count', 'number', 'Nombre de Niveaux (Layers)', true, 'Requis', 'Ex: 2', 'form-008'),
('field-008-6', 'trust_deed_provided', 'radio', 'Acte de fiducie fourni ?', true, 'Requis', NULL, 'form-008'),
('field-008-7', 'economic_substance', 'radio', 'Substance Économique locale', true, 'Requis', NULL, 'form-008'),
('field-008-8', 'substance_details', 'text', 'Détails Activité Réelle', false, NULL, 'Employés, locaux...', 'form-008');

-- Batch generic fields for form-003, form-004, form-009, form-010
INSERT INTO field_config (id, name, type, label, required, error_message, placeholder, form_config_id) VALUES
('field-form-003-std', 'general_info', 'text', 'Informations complémentaires', false, NULL, 'Précisez ici...', 'form-003'),
('field-form-004-std', 'general_info', 'text', 'Informations complémentaires', false, NULL, 'Précisez ici...', 'form-004'),
('field-form-009-std', 'general_info', 'text', 'Informations complémentaires', false, NULL, 'Précisez ici...', 'form-009'),
('field-form-010-std', 'general_info', 'text', 'Informations complémentaires', false, NULL, 'Précisez ici...', 'form-010');

-- 21.3 FIELD_OPTION
INSERT INTO field_option (id, name, value, field_config_id) VALUES
('opt-002-3-1', 'SARL', 'SARL', 'field-002-3'),
('opt-002-3-2', 'SA', 'SA', 'field-002-3'),
('opt-002-3-3', 'SAS', 'SAS', 'field-002-3'),
('opt-005-1-1', 'Oui', 'YES', 'field-005-1'),
('opt-005-1-2', 'Non', 'NO', 'field-005-1'),
-- Options for field-007-1 (Source de la fortune)
('opt-007-1-1', 'Héritage', 'HERITAGE', 'field-007-1'),
('opt-007-1-2', 'Épargne Salariale', 'SAVINGS', 'field-007-1'),
('opt-007-1-3', 'Cession Entreprise', 'BUSINESS_SALE', 'field-007-1'),
('opt-007-1-4', 'Investissements', 'INVESTMENTS', 'field-007-1'),
-- Options for field-007-6 (High risk country)
('opt-007-6-1', 'Russie', 'RUSSIA', 'field-007-6'),
('opt-007-6-2', 'Iran', 'IRAN', 'field-007-6'),
('opt-007-6-3', 'Myanmar', 'MYANMAR', 'field-007-6'),
-- Options for field-007-7 (Sanction Check)
('opt-007-7-1', 'Oui (Revue OK)', 'YES', 'field-007-7'),
('opt-007-7-2', 'Non (Alerte)', 'NO', 'field-007-7'),
-- Options for field-008-1 (Offshore jurisdiction)
('opt-008-1-1', 'Delaware, USA', 'DELAWARE', 'field-008-1'),
('opt-008-1-2', 'Îles Caïmans', 'CAYMANS', 'field-008-1'),
('opt-008-1-3', 'Îles Vierges Britanniques', 'BVI', 'field-008-1'),
('opt-008-1-4', 'Seychelles', 'SEYCHELLES', 'field-008-1'),
-- Options for field-008-3 (Has intermediary)
('opt-008-3-1', 'Oui', 'YES', 'field-008-3'),
('opt-008-3-2', 'Non', 'NO', 'field-008-3'),
-- Options for field-008-6 (Trust deed provided)
('opt-008-6-1', 'Oui', 'YES', 'field-008-6'),
('opt-008-6-2', 'Non', 'NO', 'field-008-6'),
('opt-008-6-3', 'N/A', 'NA', 'field-008-6'),
-- Options for field-008-7 (Substance verified)
('opt-008-7-1', 'Oui (Validé)', 'YES', 'field-008-7'),
('opt-008-7-2', 'Non (Sans substance)', 'NO', 'field-008-7');

-- ============================================================================
-- 22. DILIGENCE FORM RESULTS & ANSWERS (DiligenceFormResult, FieldResult)
-- ============================================================================
-- 22.1 DILIGENCE_FORM_RESULT
INSERT INTO diligence_form_result (id, form_config_id, client_id, creation_date, last_update_date) VALUES
('res-001', 'form-001', 11, '2026-01-05 09:30:00', '2026-01-05 09:45:00'),
('res-002', 'form-005', 11, '2026-01-05 09:50:00', '2026-01-05 10:00:00'),
('res-003', 'form-002', 21, '2026-05-12 14:30:00', '2026-05-12 15:00:00'),
('res-004', 'form-006', 21, '2026-05-12 15:10:00', '2026-05-12 15:30:00'),
('res-005', 'form-004', 26, '2026-05-20 10:00:00', '2026-05-20 10:30:00'),
('res-006', 'form-007', 14, '2026-02-14 14:30:00', '2026-02-14 15:15:00'), -- Roman Abramovich Haut Risque
('res-007', 'form-008', 22, '2026-05-15 11:00:00', '2026-05-15 12:00:00'); -- Sberbank Audit Offshore

-- 22.2 FIELD_RESULT
INSERT INTO field_result (id, field_config_id, field_option_id, value, diligence_form_result_id) VALUES
-- res-001 (form-001 for client 11)
(1, 'field-001-1', NULL, 'Vladimir Putin', 'res-001'),
(2, 'field-001-2', NULL, '07/10/1952', 'res-001'),
(3, 'field-001-3', NULL, 'passport_vp.pdf', 'res-001'),
-- res-002 (form-005 for client 11)
(4, 'field-005-1', 'opt-005-1-1', 'YES', 'res-002'),
(5, 'field-005-2', NULL, 'Président de la Fédération de Russie', 'res-002'),
-- res-003 (form-002 for client 21)
(6, 'field-002-1', NULL, 'NovaTech SAS', 'res-003'),
(7, 'field-002-2', NULL, 'FR99887766554', 'res-003'),
(8, 'field-002-3', 'opt-002-3-3', 'SAS', 'res-003'),
-- res-004 (form-006 for client 21)
(9, 'field-006-1', NULL, '3', 'res-004'),
-- res-005 (form-004 for client 26)
(10, 'field-form-004-std', NULL, 'Informations standards pour ONG Écologique', 'res-005'),
-- res-006 (form-007 for client 14 - Roman Abramovich)
(11, 'field-007-1', 'opt-007-1-3', 'BUSINESS_SALE', 'res-006'),
(12, 'field-007-2', NULL, 'Cession d''actifs sidérurgiques historiques (Sibneft, Evraz).', 'res-006'),
(13, 'field-007-3', NULL, 'Domiciliation et investissements majeurs dans les juridictions concernées.', 'res-006'),
(14, 'field-007-4', NULL, '25000000', 'res-006'),
(15, 'field-007-5', NULL, '120000000', 'res-006'),
(16, 'field-007-6', 'opt-007-6-1', 'RUSSIA', 'res-006'),
(17, 'field-007-7', 'opt-007-7-1', 'YES', 'res-006'),
(18, 'field-007-8', NULL, 'Revue effectuée, sous sanctions internationales mais fonds isolés.', 'res-006'),
-- res-007 (form-008 for client 22 - Sberbank)
(19, 'field-008-1', 'opt-008-1-2', 'CAYMANS', 'res-007'),
(20, 'field-008-2', NULL, 'CY-99881122', 'res-007'),
(21, 'field-008-3', 'opt-008-3-1', 'YES', 'res-007'),
(22, 'field-008-4', NULL, 'Trident Trust Cayman', 'res-007'),
(23, 'field-008-5', NULL, '4', 'res-007'),
(24, 'field-008-6', 'opt-008-6-1', 'YES', 'res-007'),
(25, 'field-008-7', 'opt-008-7-2', 'NO', 'res-007'),
(26, 'field-008-8', NULL, 'Simple boîte aux lettres aux Caïmans. Pas de salariés locaux.', 'res-007');

SET SQL_SAFE_UPDATES = 1;
COMMIT;
