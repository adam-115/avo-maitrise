
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE `app_users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `address` text,
  `avatar_url` longtext,
  `barreau_id` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `gsm` varchar(255) DEFAULT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `is_partner` bit(1) DEFAULT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `last_name` varchar(255) NOT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  `photo_blob` longtext,
  `role` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_4vj92ux8a2eehds1mdvmks473` (`email`),
  UNIQUE KEY `UK_spsnwr241e9k9c8p5xl4k45ih` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `appointements` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `client_case` varchar(255) DEFAULT NULL,
  `date` date NOT NULL,
  `end_time` varchar(255) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL,
  `time` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `client_id` bigint DEFAULT NULL,
  `dossier_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKp4kxs1wc0iitddqg5uqmxckmc` (`client_id`),
  KEY `FK3am6wlov4qy42y0x1p85u4so9` (`dossier_id`),
  CONSTRAINT `FK3am6wlov4qy42y0x1p85u4so9` FOREIGN KEY (`dossier_id`) REFERENCES `dossiers` (`id`),
  CONSTRAINT `FKp4kxs1wc0iitddqg5uqmxckmc` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `associations` (
  `cin_representant_legal` varchar(255) DEFAULT NULL,
  `date_naissance_representant_legal` datetime(6) DEFAULT NULL,
  `nationalite_representant_legal` varchar(255) DEFAULT NULL,
  `nom` varchar(255) DEFAULT NULL,
  `nom_representant_legal` varchar(255) DEFAULT NULL,
  `numero_id_fiscal` varchar(255) DEFAULT NULL,
  `numero_registre_national` varchar(255) DEFAULT NULL,
  `prenom_representant_legal` varchar(255) DEFAULT NULL,
  `id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `FKjbfkemo570s1ankirp98qab9t` FOREIGN KEY (`id`) REFERENCES `clients` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `client_diligence_status` (
  `id` varchar(255) NOT NULL,
  `creation_date` datetime(6) DEFAULT NULL,
  `enabled` bit(1) NOT NULL,
  `last_update_date` datetime(6) DEFAULT NULL,
  `result_id` varchar(255) DEFAULT NULL,
  `status` enum('PENDING','SUBMITTED','VALIDATED') DEFAULT NULL,
  `client_id` bigint DEFAULT NULL,
  `form_config_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKel02yhbqm96tpy64g15iaicp6` (`client_id`),
  KEY `FKaykw1xrerrhbtceic91ndu757` (`form_config_id`),
  CONSTRAINT `FKaykw1xrerrhbtceic91ndu757` FOREIGN KEY (`form_config_id`) REFERENCES `form_config` (`id`),
  CONSTRAINT `FKel02yhbqm96tpy64g15iaicp6` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `clients` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `adresse` varchar(255) DEFAULT NULL,
  `client_status` varchar(50) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `email` varchar(255) NOT NULL,
  `pays` varchar(255) DEFAULT NULL,
  `secteur_activite` varchar(255) DEFAULT NULL,
  `telephone` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `clients_moraux` (
  `cin_representant_legal` varchar(255) DEFAULT NULL,
  `date_naissance_representant_legal` datetime(6) DEFAULT NULL,
  `forme_juridique` varchar(255) DEFAULT NULL,
  `nationalite_representant_legal` varchar(255) DEFAULT NULL,
  `nom_commercial` varchar(255) DEFAULT NULL,
  `nom_representant_legal` varchar(255) DEFAULT NULL,
  `numero_id_fiscal` varchar(255) DEFAULT NULL,
  `numero_registre_commerce` varchar(255) DEFAULT NULL,
  `prenom_representant_legal` varchar(255) DEFAULT NULL,
  `id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `FKjtmox935l7pgo6t0dllkltchq` FOREIGN KEY (`id`) REFERENCES `clients` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `contact_points` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `adresse` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `nom` varchar(255) NOT NULL,
  `occupation` varchar(255) NOT NULL,
  `prenom` varchar(255) NOT NULL,
  `telephone` varchar(255) NOT NULL,
  `client_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK3ef7b3kljmh0dxebodjaow9tx` (`client_id`),
  CONSTRAINT `FK3ef7b3kljmh0dxebodjaow9tx` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `diligence_form_result` (
  `id` varchar(255) NOT NULL,
  `creation_date` datetime(6) DEFAULT NULL,
  `last_update_date` datetime(6) DEFAULT NULL,
  `client_id` bigint DEFAULT NULL,
  `form_config_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK5tcileboc14m6e169kuv1bm7l` (`client_id`),
  KEY `FK7bvyurpyvmrleibl26km4pos` (`form_config_id`),
  CONSTRAINT `FK5tcileboc14m6e169kuv1bm7l` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`),
  CONSTRAINT `FK7bvyurpyvmrleibl26km4pos` FOREIGN KEY (`form_config_id`) REFERENCES `form_config` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `documents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date_upload` datetime(6) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `est_valide` bit(1) NOT NULL,
  `file_data` longblob,
  `filename` varchar(255) DEFAULT NULL,
  `label` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `nom_fichier` varchar(255) DEFAULT NULL,
  `tags` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `type_document` enum('DOSSIER','CLIENT','MODEL') DEFAULT NULL,
  `url_stockage` varchar(255) DEFAULT NULL,
  `client_id` bigint DEFAULT NULL,
  `dossier_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKixuco32pk6hwb9k015vm27b1m` (`client_id`),
  KEY `FKbbv91pgsrvf472w33d637dm9s` (`dossier_id`),
  CONSTRAINT `FKbbv91pgsrvf472w33d637dm9s` FOREIGN KEY (`dossier_id`) REFERENCES `dossiers` (`id`),
  CONSTRAINT `FKixuco32pk6hwb9k015vm27b1m` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `domaines_juridiques` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `active` bit(1) NOT NULL,
  `code` varchar(255) NOT NULL,
  `color` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `display_order` int DEFAULT NULL,
  `label` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_gmqmvdarscyjo0940mchw5fjf` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `dossier_contacts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `adresse` varchar(255) DEFAULT NULL,
  `civilite` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `entreprise` varchar(255) DEFAULT NULL,
  `nom` varchar(255) NOT NULL,
  `notes` text,
  `num_toque` varchar(255) DEFAULT NULL,
  `observation` text,
  `pays` varchar(255) DEFAULT NULL,
  `prenom` varchar(255) NOT NULL,
  `profession` varchar(255) DEFAULT NULL,
  `site_web` varchar(255) DEFAULT NULL,
  `telephone_fixe` varchar(255) DEFAULT NULL,
  `telephone_mobile` varchar(255) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `dossier_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKojwght1qfwwtootxat95fl7bu` (`dossier_id`),
  CONSTRAINT `FKojwght1qfwwtootxat95fl7bu` FOREIGN KEY (`dossier_id`) REFERENCES `dossiers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `dossier_documents` (
  `dossier_id` bigint NOT NULL,
  `document_id` bigint NOT NULL,
  UNIQUE KEY `UK_l864dsc6do4oyadbvii71q9jj` (`document_id`),
  KEY `FK2m4ws4bpcfquvrhyf626ei8yh` (`dossier_id`),
  CONSTRAINT `FK2m4ws4bpcfquvrhyf626ei8yh` FOREIGN KEY (`dossier_id`) REFERENCES `dossiers` (`id`),
  CONSTRAINT `FKcy26kl6ew1tk1tornmix2lr8g` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `dossier_intervenants` (
  `dossier_id` bigint NOT NULL,
  `intervenant_id` varchar(255) DEFAULT NULL,
  KEY `FKlityb4ofida5fuyd5aur9ipdj` (`dossier_id`),
  CONSTRAINT `FKlityb4ofida5fuyd5aur9ipdj` FOREIGN KEY (`dossier_id`) REFERENCES `dossiers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `dossiers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `budget_estime` double DEFAULT NULL,
  `client_id` bigint DEFAULT NULL,
  `date_cloture` datetime(6) DEFAULT NULL,
  `date_ouverture` datetime(6) DEFAULT NULL,
  `description` text,
  `domaine_juridique` varchar(255) DEFAULT NULL,
  `methode_facturation` varchar(255) DEFAULT NULL,
  `priorite_id` varchar(255) DEFAULT NULL,
  `reference_interne` varchar(255) NOT NULL,
  `responsable_id` varchar(255) DEFAULT NULL,
  `statut_id` varchar(255) DEFAULT NULL,
  `taux_horaire_applique` double DEFAULT NULL,
  `titre` varchar(255) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_qj1r6e76s3psuf8lpkspiq698` (`reference_interne`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `dossiers_priorites` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `active` bit(1) NOT NULL,
  `code` varchar(255) NOT NULL,
  `color` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `display_order` int DEFAULT NULL,
  `label` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_9qbi2i9s9k7bhpqfgda2p3sy3` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `event_types` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `active` bit(1) NOT NULL,
  `code` varchar(255) NOT NULL,
  `color` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `display_order` int DEFAULT NULL,
  `label` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_t78o6so99krlwtbni3nrhnhg9` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `field_config` (
  `id` varchar(255) NOT NULL,
  `error_message` varchar(255) DEFAULT NULL,
  `label` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `placeholder` varchar(255) DEFAULT NULL,
  `required` bit(1) NOT NULL,
  `type` varchar(255) DEFAULT NULL,
  `form_config_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKbdri8bv0ebanglmbooiwy5l1c` (`form_config_id`),
  CONSTRAINT `FKbdri8bv0ebanglmbooiwy5l1c` FOREIGN KEY (`form_config_id`) REFERENCES `form_config` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `field_option` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `value` varchar(255) DEFAULT NULL,
  `field_config_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKa3a6updcm3f413grlldgnpalt` (`field_config_id`),
  CONSTRAINT `FKa3a6updcm3f413grlldgnpalt` FOREIGN KEY (`field_config_id`) REFERENCES `field_config` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `field_result` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `field_config_id` varchar(255) DEFAULT NULL,
  `field_option_id` varchar(255) DEFAULT NULL,
  `value` longtext,
  `diligence_form_result_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKg06woxa2ipast7wp1mbxo4ffl` (`diligence_form_result_id`),
  CONSTRAINT `FKg06woxa2ipast7wp1mbxo4ffl` FOREIGN KEY (`diligence_form_result_id`) REFERENCES `diligence_form_result` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `form_config` (
  `id` varchar(255) NOT NULL,
  `creation_date` datetime(6) DEFAULT NULL,
  `description` text,
  `last_update_date` datetime(6) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `target_client_type` enum('PERSONNE','SOCIETE','INSTITUTION','ASSOCIATION') DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `type` enum('INDULGENCE') DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `institutions` (
  `cin_representant_legal` varchar(255) DEFAULT NULL,
  `date_naissance_representant_legal` datetime(6) DEFAULT NULL,
  `nationalite_representant_legal` varchar(255) DEFAULT NULL,
  `nom` varchar(255) DEFAULT NULL,
  `nom_representant_legal` varchar(255) DEFAULT NULL,
  `numero_id_fiscal` varchar(255) DEFAULT NULL,
  `numero_registre_national` varchar(255) DEFAULT NULL,
  `prenom_representant_legal` varchar(255) DEFAULT NULL,
  `id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `FK178q9ifggrwx52s34f84omnkk` FOREIGN KEY (`id`) REFERENCES `clients` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `matter_activities` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(255) NOT NULL,
  `author` varchar(255) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `description` text,
  `dossier_id` bigint NOT NULL,
  `target_id` bigint DEFAULT NULL,
  `target_type` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `matter_event_participants` (
  `event_id` bigint NOT NULL,
  `participant_id` varchar(255) DEFAULT NULL,
  KEY `FKaft6qygqoak8le9hld3215sis` (`event_id`),
  CONSTRAINT `FKaft6qygqoak8le9hld3215sis` FOREIGN KEY (`event_id`) REFERENCES `matter_events` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `matter_events` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `description` text,
  `dossier_id` bigint NOT NULL,
  `end_date` datetime(6) NOT NULL,
  `is_all_day` bit(1) NOT NULL,
  `lieu` varchar(255) DEFAULT NULL,
  `reminder_minutes_before` int DEFAULT NULL,
  `start_date` datetime(6) NOT NULL,
  `statut` varchar(255) NOT NULL,
  `titre` varchar(255) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `event_type_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKnyw0x0sdy2dn9tfpnnxenppg6` (`event_type_id`),
  CONSTRAINT `FKnyw0x0sdy2dn9tfpnnxenppg6` FOREIGN KEY (`event_type_id`) REFERENCES `event_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `note_categories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `active` bit(1) NOT NULL,
  `code` varchar(255) NOT NULL,
  `color` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `display_order` int DEFAULT NULL,
  `label` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_10f0a5g14m20lxi75gusyccki` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `notes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `description` text NOT NULL,
  `title` varchar(255) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `auteur_id` bigint DEFAULT NULL,
  `category_id` bigint DEFAULT NULL,
  `dossier_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK5uc20u0wn2dyogqq3jsw2mbg` (`auteur_id`),
  KEY `FKnbu9ry6nbo3jhm1oig6nkh4jm` (`category_id`),
  KEY `FK1sjwkxey6illa8jqahm8fnmnj` (`dossier_id`),
  CONSTRAINT `FK1sjwkxey6illa8jqahm8fnmnj` FOREIGN KEY (`dossier_id`) REFERENCES `dossiers` (`id`),
  CONSTRAINT `FK5uc20u0wn2dyogqq3jsw2mbg` FOREIGN KEY (`auteur_id`) REFERENCES `app_users` (`id`),
  CONSTRAINT `FKnbu9ry6nbo3jhm1oig6nkh4jm` FOREIGN KEY (`category_id`) REFERENCES `note_categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `client_id` bigint DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `is_read` bit(1) DEFAULT NULL,
  `message` text,
  `title` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `personnes_physiques` (
  `cin` varchar(255) DEFAULT NULL,
  `date_naissance` date DEFAULT NULL,
  `nationalite` varchar(255) DEFAULT NULL,
  `nom` varchar(255) DEFAULT NULL,
  `prenom` varchar(255) DEFAULT NULL,
  `id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `FK5p24piv85dh4496i8iac774p1` FOREIGN KEY (`id`) REFERENCES `clients` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `screening_execution` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `execution_message` varchar(255) DEFAULT NULL,
  `raw_response` json DEFAULT NULL,
  `status` enum('PASSED','FAILED') DEFAULT NULL,
  `client_id` bigint NOT NULL,
  `ubo_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK5b9axspc72pbswisdlq6cqed3` (`client_id`),
  KEY `FK5kqnh0n5mbpn6x0900052pbb2` (`ubo_id`),
  CONSTRAINT `FK5b9axspc72pbswisdlq6cqed3` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`),
  CONSTRAINT `FK5kqnh0n5mbpn6x0900052pbb2` FOREIGN KEY (`ubo_id`) REFERENCES `ubos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `screening_matches` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `match_reason` text,
  `raw_response` json DEFAULT NULL,
  `reviewed_at` datetime(6) DEFAULT NULL,
  `reviewed_by` varchar(255) DEFAULT NULL,
  `reviewer_comment` text,
  `score` double DEFAULT NULL,
  `status` varchar(50) NOT NULL,
  `target_name` varchar(255) DEFAULT NULL,
  `yente_id` varchar(255) DEFAULT NULL,
  `yente_last_update` varchar(255) DEFAULT NULL,
  `client_id` bigint NOT NULL,
  `screening_execution_id` bigint DEFAULT NULL,
  `ubo_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKejo8n3c330h98ai56e5g6nv0t` (`client_id`),
  KEY `FKrvn5q8yjkexvbtgf2q3fynkr2` (`screening_execution_id`),
  KEY `FKpn4x99ohgpgm21g5f9f72o7bn` (`ubo_id`),
  CONSTRAINT `FKejo8n3c330h98ai56e5g6nv0t` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`),
  CONSTRAINT `FKpn4x99ohgpgm21g5f9f72o7bn` FOREIGN KEY (`ubo_id`) REFERENCES `ubos` (`id`),
  CONSTRAINT `FKrvn5q8yjkexvbtgf2q3fynkr2` FOREIGN KEY (`screening_execution_id`) REFERENCES `screening_execution` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `secteurs_activite` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `actif` bit(1) NOT NULL,
  `code` varchar(255) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `libelle` varchar(255) NOT NULL,
  `ordre_affichage` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_oq0wd38uhc1gcnlh3ptyn8p5r` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `statuts_dossier` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `active` bit(1) NOT NULL,
  `code` varchar(255) NOT NULL,
  `color` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `display_order` int DEFAULT NULL,
  `label` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_ivspdqffkf8d91x7tae9v6p45` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `task_assignees` (
  `task_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  KEY `FKpm3g0n28hvn475sjgroxyd71i` (`user_id`),
  KEY `FKs0jy5sv972lpa2wfx95m7xebb` (`task_id`),
  CONSTRAINT `FKpm3g0n28hvn475sjgroxyd71i` FOREIGN KEY (`user_id`) REFERENCES `app_users` (`id`),
  CONSTRAINT `FKs0jy5sv972lpa2wfx95m7xebb` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `task_categories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `actif` bit(1) NOT NULL,
  `code` varchar(255) NOT NULL,
  `couleur` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `icone` varchar(255) DEFAULT NULL,
  `libelle` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_lm6lvd3f8rl2wxhhnjd9ob5ny` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `task_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(255) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `description` text,
  `task_id` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `task_statuses` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(255) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `is_closing_status` bit(1) DEFAULT NULL,
  `libelle` varchar(255) NOT NULL,
  `ordre_affichage` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_d4g1tjhoh3nn5ikgle7hr12i9` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `tasks` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `date_echeance` datetime(6) DEFAULT NULL,
  `description` text,
  `dossier_id` bigint NOT NULL,
  `estimated_time_minutes` int DEFAULT NULL,
  `invoice_id` varchar(255) DEFAULT NULL,
  `is_completed` bit(1) DEFAULT NULL,
  `priorite` varchar(255) NOT NULL,
  `titre` varchar(255) NOT NULL,
  `category_id` bigint DEFAULT NULL,
  `created_by_id` bigint DEFAULT NULL,
  `status_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK42ldd63quus0efpi2ec64q0qg` (`category_id`),
  KEY `FKhsmcliffdcqrpchr490ux9hj6` (`created_by_id`),
  KEY `FKa0dcdc9qxbpoes4a1p4i0f9y3` (`status_id`),
  CONSTRAINT `FK42ldd63quus0efpi2ec64q0qg` FOREIGN KEY (`category_id`) REFERENCES `task_categories` (`id`),
  CONSTRAINT `FKa0dcdc9qxbpoes4a1p4i0f9y3` FOREIGN KEY (`status_id`) REFERENCES `task_statuses` (`id`),
  CONSTRAINT `FKhsmcliffdcqrpchr490ux9hj6` FOREIGN KEY (`created_by_id`) REFERENCES `app_users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `test_entities` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `message` varchar(255) DEFAULT NULL,
  `version` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `ubos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `aml_analysis_status` varchar(255) DEFAULT NULL,
  `aml_target_entity_name` varchar(255) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `full_name` varchar(255) NOT NULL,
  `nationality` varchar(255) DEFAULT NULL,
  `percentage_of_ownership` double DEFAULT NULL,
  `role_in_company` varchar(255) DEFAULT NULL,
  `client_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKeri164y9ipc2wxo8ggoaue5tt` (`client_id`),
  CONSTRAINT `FKeri164y9ipc2wxo8ggoaue5tt` FOREIGN KEY (`client_id`) REFERENCES `clients_moraux` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;