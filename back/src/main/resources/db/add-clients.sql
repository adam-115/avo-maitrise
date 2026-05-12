SET SQL_SAFE_UPDATES = 0;


-- ============================================================================
-- 1. Secteur d activité 
-- ============================================================================


INSERT INTO secteurs_activite (code, libelle, ordre_affichage, actif, created_at) VALUES 
('IT', 'Technologies de l''information et de la communication', 1, true, CURRENT_TIMESTAMP),
('FIN', 'Activités financières et d''assurance', 2, true, CURRENT_TIMESTAMP),
('SAN', 'Santé humaine et action sociale', 3, true, CURRENT_TIMESTAMP),
('EDU', 'Enseignement et Éducation', 4, true, CURRENT_TIMESTAMP),
('BTP', 'Construction et BTP', 5, true, CURRENT_TIMESTAMP),
('COM', 'Commerce et Distribution', 6, true, CURRENT_TIMESTAMP),
('IND', 'Industrie manufacturière', 7, true, CURRENT_TIMESTAMP),
('AGR', 'Agriculture, sylviculture et pêche', 8, true, CURRENT_TIMESTAMP),
('IMM', 'Activités immobilières', 9, true, CURRENT_TIMESTAMP),
('TRA', 'Transports et entreposage', 10, true, CURRENT_TIMESTAMP);

-- ============================================================================
-- 1. PERSONNES PHYSIQUES (Individuals)
-- ============================================================================

-- [NOT SANCTIONED] Alice Smith
INSERT INTO clients (id, email, telephone, adresse, pays, client_status) 
VALUES (101, 'alice.smith@test.com', '+33611111111', '123 Avenue des Champs, Paris', 'France','AML_REQUIRED');
INSERT INTO personnes_physiques (id, nom, prenom, nationalite, cin, date_naissance) 
VALUES (101, 'Smith', 'Alice', 'Française', 'FR-AA11', '1990-01-01');
INSERT INTO documents (id, nom_fichier, type_document, url_stockage, date_upload, est_valide, client_id) 
VALUES (1001, 'id_alice.pdf', 'ID_CARD', '/docs/101/id.pdf', NOW(), true, 101);

-- [SANCTIONED] Carlos Danger
INSERT INTO clients (id, email, telephone, adresse, pays, client_status) 
VALUES (102, 'carlos@danger.net', '+999000000', 'Sanctioned Street 1', 'Mexico', 'AML_REQUIRED');
INSERT INTO personnes_physiques (id, nom, prenom, nationalite, cin, date_naissance) 
VALUES (102, 'Danger', 'Carlos', 'Mexican', 'MX-99', '1970-12-12');


-- ============================================================================
-- 2. CLIENTS MORAUX (Companies)
-- ============================================================================

-- [NOT SANCTIONED] Blue Star Tech
INSERT INTO clients (id, email, telephone, adresse, pays, client_status) 
VALUES (201, 'contact@bluestar.com', '+12025550101', 'Silicon Valley', 'USA','AML_REQUIRED');
INSERT INTO clients_moraux (id, nom_commercial, forme_juridique, numero_registre_commerce, numero_id_fiscal) 
VALUES (201, 'Blue Star Tech Inc', 'Corporation', 'US-RC-123', 'US-TAX-456');
INSERT INTO ubos (id, full_name, nationality, role_in_company, percentage_of_ownership, client_id) 
VALUES (2001, 'Bob Star', 'American', 'CEO', 100.0, 201);

-- [SANCTIONED] Red Alert Trading
INSERT INTO clients (id, email, telephone, adresse, pays, client_status) 
VALUES (202, 'ops@redalert.ru', '+7495000000', 'Red Square 5', 'Russia', 'AML_REQUIRED');
INSERT INTO clients_moraux (id, nom_commercial, forme_juridique, numero_registre_commerce, numero_id_fiscal) 
VALUES (202, 'Red Alert Trading', 'LLC', 'RU-RC-666', 'RU-TAX-666');
INSERT INTO ubos (id, full_name, nationality, role_in_company, percentage_of_ownership, client_id, aml_analysis_status) 
VALUES (2002, 'Viktor Red', 'Russe', 'Owner', 80.0, 202, 'AML_REQUIRED');


-- ============================================================================
-- 3. ASSOCIATIONS
-- ============================================================================

-- [NOT SANCTIONED] Ocean Clean-up
INSERT INTO clients (id, email, telephone, adresse, pays, client_status) 
VALUES (301, 'hello@ocean.org', '+33500000000', 'Plage des Arts, Marseille', 'France','AML_REQUIRED');
INSERT INTO associations (id, nom, numero_registre_national, numero_id_fiscal) 
VALUES (301, 'Ocean Clean-up NGO', 'RNA-OC-1', 'TAX-OC-1');
INSERT INTO contact_points (id, nom, prenom, email, telephone, occupation, client_id) 
VALUES (30001, 'Leport', 'Jacques', 'jacques@ocean.org', '+33600000001', 'Manager', 301);

-- [SANCTIONED] Secret Support Group
INSERT INTO clients (id, email, telephone, adresse, pays, client_status) 
VALUES (302, 'secret@front.com', '+999888777', 'Unknown Location', 'Global', 'AML_REQUIRED');
INSERT INTO associations (id, nom, numero_registre_national, numero_id_fiscal) 
VALUES (302, 'Secret Support Group', 'RNA-HIDDEN', 'TAX-HIDDEN');


-- ============================================================================
-- 4. INSTITUTIONS
-- ============================================================================

-- [NOT SANCTIONED] City Hall
INSERT INTO clients (id, email, telephone, adresse, pays, client_status) 
VALUES (401, 'mayor@city.gov', '+33122334455', 'Hôtel de Ville, Paris', 'France','AML_REQUIRED');
INSERT INTO institutions (id, nom, numero_registre_national, numero_id_fiscal) 
VALUES (401, 'Mairie de Paris', 'RN-PARIS-01', 'TAX-PARIS-01');

-- [SANCTIONED] Central Bank of SanctionLand
INSERT INTO clients (id, email, telephone, adresse, pays, client_status) 
VALUES (402, 'hq@centralbank.sl', '+111222333', 'Central Plaza', 'SanctionLand', 'AML_REQUIRED');
INSERT INTO institutions (id, nom, numero_registre_national, numero_id_fiscal) 
VALUES (402, 'Central Bank of SanctionLand', 'RN-SL-CB', 'TAX-SL-CB');

INSERT INTO clients (id, email, telephone, adresse, pays) 
VALUES (111, ' ', ' ', ' ','FR');
INSERT INTO personnes_physiques (id, nom, prenom, nationalite, cin, date_naissance) 
VALUES (111, 'SARKOZY', 'Nicolas', 'Française', 'FR-AA11', '1955-01-28');
INSERT INTO documents (id, nom_fichier, type_document, url_stockage, date_upload, est_valide, client_id) 
VALUES (1011, 'id_alice.pdf', 'ID_CARD', '/docs/101/id.pdf', NOW(), true, 101);

INSERT INTO clients (id, email, telephone, adresse, pays) 
VALUES (112, ' ', ' ', ' ','Russe');
INSERT INTO personnes_physiques (id, nom, prenom, nationalite, cin, date_naissance) 
VALUES (112, 'PUTIN', 'Vladimir', 'Russe', 'CIN002', '1952-10-07');
INSERT INTO documents (id, nom_fichier, type_document, url_stockage, date_upload, est_valide, client_id) 
VALUES (1012, 'id_alice.pdf', 'ID_CARD', '/docs/101/id.pdf', NOW(), true, 101);

SET SQL_SAFE_UPDATES = 1;
