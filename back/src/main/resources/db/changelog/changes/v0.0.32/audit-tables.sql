-- Journal d'audit, phase 1 (généré depuis le modèle Hibernate Envers par AuditSchemaExportTest, puis ajusté) :
-- * audit_revision : qui / quand / d'où pour chaque lot de modifications
-- * audit_log      : consultations, téléchargements, exports, accès IA
-- * *_aud          : historique complet des entités sensibles (dossiers, clients, LCB-FT, diligences, factures...)
-- Les colonnes enum sont en varchar pour qu'un nouveau statut n'empêche jamais d'écrire l'historique.

create table audit_revision (id bigint not null auto_increment, ip_address varchar(64), origin varchar(20) not null, revision_timestamp bigint not null, username varchar(255) not null, primary key (id)) engine=InnoDB;

create table audit_log (id bigint not null auto_increment, action varchar(40) not null, details varchar(1000), event_time datetime(6) not null, ip_address varchar(64), outcome varchar(20) not null, resource_id varchar(100), resource_type varchar(60) not null, user_agent varchar(512), username varchar(255) not null, primary key (id)) engine=InnoDB;

create table clients_aud (id bigint not null, rev bigint not null, revtype tinyint, adresse varchar(255), client_status VARCHAR(50), created_at datetime(6), email varchar(255), pays varchar(255), secteur_activite varchar(255), telephone varchar(255), version bigint, primary key (id, rev)) engine=InnoDB;

create table client_diligence_status_aud (id varchar(255) not null, rev bigint not null, revtype tinyint, creation_date datetime(6), enabled bit, last_update_date datetime(6), result_id varchar(255), status varchar(50), client_id bigint, form_config_id varchar(255), ubo_id bigint, primary key (id, rev)) engine=InnoDB;

create table clients_moraux_aud (id bigint not null, rev bigint not null, cin_representant_legal varchar(255), date_naissance_representant_legal datetime(6), forme_juridique varchar(255), nationalite_representant_legal varchar(255), nom_commercial varchar(255), nom_representant_legal varchar(255), numero_id_fiscal varchar(255), numero_registre_commerce varchar(255), prenom_representant_legal varchar(255), primary key (id, rev)) engine=InnoDB;

create table diligence_form_result_aud (id varchar(255) not null, rev bigint not null, revtype tinyint, creation_date datetime(6), last_update_date datetime(6), client_id bigint, form_config_id varchar(255), ubo_id bigint, primary key (id, rev)) engine=InnoDB;

create table diligence_form_result_field_result_aud (rev bigint not null, diligence_form_result_id varchar(255) not null, id bigint not null, revtype tinyint, primary key (diligence_form_result_id, id, rev)) engine=InnoDB;

create table documents_aud (id bigint not null, rev bigint not null, revtype tinyint, date_upload datetime(6), description varchar(255), est_valide bit, filename varchar(255), label varchar(255), minio_object_id varchar(255), name varchar(255), nom_fichier varchar(255), pays varchar(255), tags varchar(255), title varchar(255), type_document varchar(50), url_stockage varchar(255), client_id bigint, dossier_id bigint, primary key (id, rev)) engine=InnoDB;

create table dossier_documents_aud (rev bigint not null, dossier_id bigint not null, document_id bigint not null, revtype tinyint, primary key (dossier_id, document_id, rev)) engine=InnoDB;

create table dossier_intervenants_aud (rev bigint not null, dossier_id bigint not null, intervenant_id varchar(255) not null, revtype tinyint, primary key (dossier_id, intervenant_id, rev)) engine=InnoDB;

create table dossier_parties_aud (id bigint not null, rev bigint not null, revtype tinyint, role varchar(50), dossier_id bigint, client_id bigint, primary key (id, rev)) engine=InnoDB;

create table dossiers_aud (id bigint not null, rev bigint not null, revtype tinyint, date_cloture datetime(6), date_ouverture datetime(6), description TEXT, domaine_juridique varchar(255), priorite_id varchar(255), reference_interne varchar(255), responsable_id varchar(255), statut_id varchar(255), titre varchar(255), updated_at datetime(6), client_id bigint, primary key (id, rev)) engine=InnoDB;

create table field_config_aud (id varchar(255) not null, rev bigint not null, revtype tinyint, error_message varchar(255), label varchar(255), name varchar(255), placeholder varchar(255), required bit, type varchar(255), primary key (id, rev)) engine=InnoDB;

create table field_config_field_option_aud (rev bigint not null, field_config_id varchar(255) not null, id varchar(255) not null, revtype tinyint, primary key (field_config_id, id, rev)) engine=InnoDB;

create table field_option_aud (id varchar(255) not null, rev bigint not null, revtype tinyint, name varchar(255), value varchar(255), primary key (id, rev)) engine=InnoDB;

create table field_result_aud (id bigint not null, rev bigint not null, revtype tinyint, field_config_id varchar(255), field_option_id varchar(255), value LONGTEXT, primary key (id, rev)) engine=InnoDB;

create table form_config_aud (id varchar(255) not null, rev bigint not null, revtype tinyint, creation_date datetime(6), description TEXT, last_update_date datetime(6), name varchar(255), target_client_type varchar(50), title varchar(255), type varchar(50), primary key (id, rev)) engine=InnoDB;

create table form_config_field_config_aud (rev bigint not null, form_config_id varchar(255) not null, id varchar(255) not null, revtype tinyint, primary key (form_config_id, id, rev)) engine=InnoDB;

create table invoice_aud (id bigint not null, rev bigint not null, revtype tinyint, due_date date, dunning_level integer, is_disputed bit, issue_date date, note varchar(500), numero_facture varchar(255), status varchar(50), subtotal_amount decimal(18,2), tax_rate decimal(5,2), total_amount decimal(18,2), dossier_id bigint, primary key (id, rev)) engine=InnoDB;

create table personnes_physiques_aud (id bigint not null, rev bigint not null, cin varchar(255), date_naissance date, nationalite varchar(255), nom varchar(255), prenom varchar(255), primary key (id, rev)) engine=InnoDB;

create table screening_execution_aud (id bigint not null, rev bigint not null, revtype tinyint, created_at datetime(6), execution_message varchar(255), raw_response json, status varchar(50), client_id bigint, ubo_id bigint, primary key (id, rev)) engine=InnoDB;

create table screening_matches_aud (id bigint not null, rev bigint not null, revtype tinyint, client_version_at_review bigint, created_at datetime(6), match_reason TEXT, raw_response json, reviewed_at datetime(6), reviewed_by varchar(255), reviewer_comment TEXT, score float(53), status VARCHAR(50), target_name varchar(255), yente_id varchar(255), yente_last_update varchar(255), client_id bigint, screening_execution_id bigint, ubo_id bigint, primary key (id, rev)) engine=InnoDB;

create table ubos_aud (id bigint not null, rev bigint not null, revtype tinyint, aml_analysis_status varchar(255), aml_target_entity_name varchar(255), date_of_birth date, full_name varchar(255), nationality varchar(255), percentage_of_ownership float(53), role_in_company varchar(255), client_id bigint, primary key (id, rev)) engine=InnoDB;

alter table client_diligence_status_aud add constraint fk_client_diligence_status_aud_rev foreign key (rev) references audit_revision (id);

alter table clients_aud add constraint fk_clients_aud_rev foreign key (rev) references audit_revision (id);

alter table clients_moraux_aud add constraint fk_clients_moraux_aud_id_rev foreign key (id, rev) references clients_aud (id, rev);

alter table diligence_form_result_aud add constraint fk_diligence_form_result_aud_rev foreign key (rev) references audit_revision (id);

alter table diligence_form_result_field_result_aud add constraint fk_diligence_form_result_field_result_aud_rev foreign key (rev) references audit_revision (id);

alter table documents_aud add constraint fk_documents_aud_rev foreign key (rev) references audit_revision (id);

alter table dossier_documents_aud add constraint fk_dossier_documents_aud_rev foreign key (rev) references audit_revision (id);

alter table dossier_intervenants_aud add constraint fk_dossier_intervenants_aud_rev foreign key (rev) references audit_revision (id);

alter table dossier_parties_aud add constraint fk_dossier_parties_aud_rev foreign key (rev) references audit_revision (id);

alter table dossiers_aud add constraint fk_dossiers_aud_rev foreign key (rev) references audit_revision (id);

alter table field_config_aud add constraint fk_field_config_aud_rev foreign key (rev) references audit_revision (id);

alter table field_option_aud add constraint fk_field_option_aud_rev foreign key (rev) references audit_revision (id);

alter table field_result_aud add constraint fk_field_result_aud_rev foreign key (rev) references audit_revision (id);

alter table field_config_field_option_aud add constraint fk_field_config_field_option_aud_rev foreign key (rev) references audit_revision (id);

alter table form_config_aud add constraint fk_form_config_aud_rev foreign key (rev) references audit_revision (id);

alter table form_config_field_config_aud add constraint fk_form_config_field_config_aud_rev foreign key (rev) references audit_revision (id);

alter table invoice_aud add constraint fk_invoice_aud_rev foreign key (rev) references audit_revision (id);

alter table personnes_physiques_aud add constraint fk_personnes_physiques_aud_id_rev foreign key (id, rev) references clients_aud (id, rev);

alter table screening_execution_aud add constraint fk_screening_execution_aud_rev foreign key (rev) references audit_revision (id);

alter table screening_matches_aud add constraint fk_screening_matches_aud_rev foreign key (rev) references audit_revision (id);

alter table ubos_aud add constraint fk_ubos_aud_rev foreign key (rev) references audit_revision (id);

create index idx_audit_log_resource on audit_log (resource_type, resource_id, event_time);

create index idx_audit_log_user on audit_log (username, event_time);

create index idx_audit_log_time on audit_log (event_time);

create index idx_audit_revision_time on audit_revision (revision_timestamp);

create index idx_audit_revision_user on audit_revision (username, revision_timestamp);
