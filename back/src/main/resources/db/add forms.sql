-- Full SQL Script for 50 FormConfigs with Fields and Options (MySQL Compatible)

-- 1. INSERT FORM_CONFIG
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
('form-010', 'INDULGENCE', 'PERSONNE', 'wealth-hnwi', 'Fortune HNWI', 'Patrimoine clients fortunés.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-011', 'INDULGENCE', 'SOCIETE', 'real-estate', 'Holding Immobilière', 'Flux locatifs.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-012', 'INDULGENCE', 'INSTITUTION', 'diplomatic', 'Missions Diplomatiques', 'Ambassades.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-013', 'INDULGENCE', 'PERSONNE', 'crypto-holder', 'Actifs Numériques', 'Portefeuilles crypto.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-014', 'INDULGENCE', 'SOCIETE', 'fintech-partner', 'Partenaire FinTech', 'Audit conformité tech.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-015', 'INDULGENCE', 'ASSOCIATION', 'religious', 'Groupes Religieux', 'Flux congrégations.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-016', 'INDULGENCE', 'PERSONNE', 'trustee-verify', 'Fiduciaires', 'Bénéficiaires trusts.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-017', 'INDULGENCE', 'SOCIETE', 'maritime', 'Commerce Maritime', 'Zones de navigation.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-018', 'INDULGENCE', 'PERSONNE', 'art-collector', 'Marché de l''Art', 'Provenance œuvres.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-019', 'INDULGENCE', 'SOCIETE', 'extractive', 'Industries Extractives', 'Secteur minier.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-020', 'INDULGENCE', 'ASSOCIATION', 'humanitarian', 'Aide Humanitaire', 'Zones de conflit.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-021', 'INDULGENCE', 'PERSONNE', 'dual-nat', 'Double Nationalité', 'Fiscalité croisée.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-022', 'INDULGENCE', 'SOCIETE', 'shell-detector', 'Sociétés Écrans', 'Substance économique.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-023', 'INDULGENCE', 'INSTITUTION', 'central-bank', 'Banques Centrales', 'Protocole inter-institution.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-024', 'INDULGENCE', 'PERSONNE', 'luxury-buyer', 'Biens de Luxe', 'Transactions haute valeur.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-025', 'INDULGENCE', 'SOCIETE', 'gambling', 'Jeux & Paris', 'Opérateurs de jeux.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-026', 'INDULGENCE', 'ASSOCIATION', 'political-party', 'Partis Politiques', 'Contributions politiques.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-027', 'INDULGENCE', 'PERSONNE', 'retired-expats', 'Expatriés Retraités', 'Pensions.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-028', 'INDULGENCE', 'SOCIETE', 'supply-chain', 'Chaîne Logistique', 'Éthique fournisseurs.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-029', 'INDULGENCE', 'INSTITUTION', 'municipal', 'Collectivités Locales', 'Marchés publics.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-030', 'INDULGENCE', 'PERSONNE', 'freelance', 'Consultant Freelance', 'Contrats finaux.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-031', 'INDULGENCE', 'SOCIETE', 'e-commerce', 'Marchand E-com', 'Flux paiements.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-032', 'INDULGENCE', 'ASSOCIATION', 'think-tank', 'Think Tanks', 'Financeurs.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-033', 'INDULGENCE', 'PERSONNE', 'pro-athlete', 'Sportifs Pro', 'Contrats sponsoring.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-034', 'INDULGENCE', 'SOCIETE', 'arms-trade', 'Commerce Armes', 'Licences export.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-035', 'INDULGENCE', 'INSTITUTION', 'sovereign', 'Fonds Souverains', 'Investissements État.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-036', 'INDULGENCE', 'PERSONNE', 'intl-student', 'Étudiants Intl', 'Frais scolarité.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-037', 'INDULGENCE', 'SOCIETE', 'precious-metals', 'Métaux Précieux', 'Or et diamants.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-038', 'INDULGENCE', 'ASSOCIATION', 'sports-club', 'Clubs Sportifs', 'Transferts.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-039', 'INDULGENCE', 'PERSONNE', 'legal-settle', 'Indemnités Légales', 'Fonds procès.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-040', 'INDULGENCE', 'SOCIETE', 'vc-investor', 'Venture Capital', 'LPs verification.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-041', 'INDULGENCE', 'INSTITUTION', 'univ-research', 'Recherche Univ', 'Subventions étrangères.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-042', 'INDULGENCE', 'PERSONNE', 'influencer', 'Influenceurs', 'Marketing social.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-043', 'INDULGENCE', 'SOCIETE', 'green-energy', 'Énergie Verte', 'Due Diligence env.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-044', 'INDULGENCE', 'ASSOCIATION', 'eco-ngo', 'ONG Éco', 'Fonds activistes.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-045', 'INDULGENCE', 'PERSONNE', 'inheritance', 'Héritiers', 'Succession.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-046', 'INDULGENCE', 'SOCIETE', 'pharma-logistics', 'Logistique Pharma', 'Licences santé.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-047', 'INDULGENCE', 'INSTITUTION', 'health-public', 'Santé Publique', 'Équipements.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-048', 'INDULGENCE', 'PERSONNE', 'digital-nomad', 'Nomade Digital', 'Résidence fiscale.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-049', 'INDULGENCE', 'SOCIETE', 'aerospace', 'Défense & Aéro', 'Composants sensibles.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('form-050', 'INDULGENCE', 'ASSOCIATION', 'microfinance', 'Microfinance', 'Recyclage prêts.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 2. INSERT FIELD_CONFIG
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
('field-013-1', 'wallet_address', 'text', 'Adresse du portefeuille', true, 'Adresse requise', '0x...', 'form-013'),
('field-013-2', 'crypto_source', 'select', 'Source des fonds', true, 'Sélectionnez une option', NULL, 'form-013');

-- BATCH INSERT FOR OTHER FIELDS
INSERT INTO field_config (id, name, type, label, required, error_message, placeholder, form_config_id)
SELECT 
    CONCAT('field-', id, '-std'), 
    'general_info', 
    'text', 
    'Informations complémentaires', 
    false, 
    NULL, 
    'Précisez ici...', 
    id 
FROM form_config WHERE id NOT IN ('form-001', 'form-002', 'form-005', 'form-006', 'form-013');

-- 3. INSERT FIELD_OPTION
INSERT INTO field_option (id, name, value, field_config_id) VALUES
('opt-002-3-1', 'SARL', 'SARL', 'field-002-3'),
('opt-002-3-2', 'SA', 'SA', 'field-002-3'),
('opt-002-3-3', 'SAS', 'SAS', 'field-002-3'),
('opt-005-1-1', 'Oui', 'YES', 'field-005-1'),
('opt-005-1-2', 'Non', 'NO', 'field-005-1'),
('opt-013-2-1', 'Mining', 'MINING', 'field-013-2'),
('opt-013-2-2', 'Staking', 'STAKING', 'field-013-2'),
('opt-013-2-3', 'Investment', 'INVESTMENT', 'field-013-2');
