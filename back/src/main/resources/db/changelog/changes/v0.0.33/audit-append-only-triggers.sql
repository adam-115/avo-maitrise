-- Journal d'audit, phase 2 : le journal devient en AJOUT SEUL.
-- Toute tentative de modification ou de suppression d'une ligne d'audit est refusée par MySQL,
-- y compris pour le compte root utilisé par l'application (de simples droits GRANT ne le permettraient pas).
-- Envers n'écrit qu'en INSERT (stratégie par défaut), l'application n'est donc pas impactée.
-- Supprimer ces triggers est un acte délibéré d'administrateur, détectable par la vérification d'intégrité.

create trigger trg_audit_log_no_update before update on audit_log for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : modification interdite (audit_log)';

create trigger trg_audit_log_no_delete before delete on audit_log for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : suppression interdite (audit_log)';

create trigger trg_audit_revision_no_update before update on audit_revision for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : modification interdite (audit_revision)';

create trigger trg_audit_revision_no_delete before delete on audit_revision for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : suppression interdite (audit_revision)';

create trigger trg_audit_log_seal_no_update before update on audit_log_seal for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : modification interdite (audit_log_seal)';

create trigger trg_audit_log_seal_no_delete before delete on audit_log_seal for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : suppression interdite (audit_log_seal)';

create trigger trg_audit_revision_seal_no_update before update on audit_revision_seal for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : modification interdite (audit_revision_seal)';

create trigger trg_audit_revision_seal_no_delete before delete on audit_revision_seal for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : suppression interdite (audit_revision_seal)';

create trigger trg_clients_no_update before update on clients_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : modification interdite (clients_aud)';

create trigger trg_clients_no_delete before delete on clients_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : suppression interdite (clients_aud)';

create trigger trg_client_diligence_status_no_update before update on client_diligence_status_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : modification interdite (client_diligence_status_aud)';

create trigger trg_client_diligence_status_no_delete before delete on client_diligence_status_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : suppression interdite (client_diligence_status_aud)';

create trigger trg_clients_moraux_no_update before update on clients_moraux_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : modification interdite (clients_moraux_aud)';

create trigger trg_clients_moraux_no_delete before delete on clients_moraux_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : suppression interdite (clients_moraux_aud)';

create trigger trg_diligence_form_result_no_update before update on diligence_form_result_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : modification interdite (diligence_form_result_aud)';

create trigger trg_diligence_form_result_no_delete before delete on diligence_form_result_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : suppression interdite (diligence_form_result_aud)';

create trigger trg_diligence_form_result_field_result_no_update before update on diligence_form_result_field_result_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : modification interdite (diligence_form_result_field_result_aud)';

create trigger trg_diligence_form_result_field_result_no_delete before delete on diligence_form_result_field_result_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : suppression interdite (diligence_form_result_field_result_aud)';

create trigger trg_documents_no_update before update on documents_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : modification interdite (documents_aud)';

create trigger trg_documents_no_delete before delete on documents_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : suppression interdite (documents_aud)';

create trigger trg_dossier_documents_no_update before update on dossier_documents_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : modification interdite (dossier_documents_aud)';

create trigger trg_dossier_documents_no_delete before delete on dossier_documents_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : suppression interdite (dossier_documents_aud)';

create trigger trg_dossier_intervenants_no_update before update on dossier_intervenants_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : modification interdite (dossier_intervenants_aud)';

create trigger trg_dossier_intervenants_no_delete before delete on dossier_intervenants_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : suppression interdite (dossier_intervenants_aud)';

create trigger trg_dossier_parties_no_update before update on dossier_parties_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : modification interdite (dossier_parties_aud)';

create trigger trg_dossier_parties_no_delete before delete on dossier_parties_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : suppression interdite (dossier_parties_aud)';

create trigger trg_dossiers_no_update before update on dossiers_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : modification interdite (dossiers_aud)';

create trigger trg_dossiers_no_delete before delete on dossiers_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : suppression interdite (dossiers_aud)';

create trigger trg_field_config_no_update before update on field_config_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : modification interdite (field_config_aud)';

create trigger trg_field_config_no_delete before delete on field_config_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : suppression interdite (field_config_aud)';

create trigger trg_field_config_field_option_no_update before update on field_config_field_option_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : modification interdite (field_config_field_option_aud)';

create trigger trg_field_config_field_option_no_delete before delete on field_config_field_option_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : suppression interdite (field_config_field_option_aud)';

create trigger trg_field_option_no_update before update on field_option_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : modification interdite (field_option_aud)';

create trigger trg_field_option_no_delete before delete on field_option_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : suppression interdite (field_option_aud)';

create trigger trg_field_result_no_update before update on field_result_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : modification interdite (field_result_aud)';

create trigger trg_field_result_no_delete before delete on field_result_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : suppression interdite (field_result_aud)';

create trigger trg_form_config_no_update before update on form_config_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : modification interdite (form_config_aud)';

create trigger trg_form_config_no_delete before delete on form_config_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : suppression interdite (form_config_aud)';

create trigger trg_form_config_field_config_no_update before update on form_config_field_config_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : modification interdite (form_config_field_config_aud)';

create trigger trg_form_config_field_config_no_delete before delete on form_config_field_config_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : suppression interdite (form_config_field_config_aud)';

create trigger trg_invoice_no_update before update on invoice_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : modification interdite (invoice_aud)';

create trigger trg_invoice_no_delete before delete on invoice_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : suppression interdite (invoice_aud)';

create trigger trg_personnes_physiques_no_update before update on personnes_physiques_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : modification interdite (personnes_physiques_aud)';

create trigger trg_personnes_physiques_no_delete before delete on personnes_physiques_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : suppression interdite (personnes_physiques_aud)';

create trigger trg_screening_execution_no_update before update on screening_execution_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : modification interdite (screening_execution_aud)';

create trigger trg_screening_execution_no_delete before delete on screening_execution_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : suppression interdite (screening_execution_aud)';

create trigger trg_screening_matches_no_update before update on screening_matches_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : modification interdite (screening_matches_aud)';

create trigger trg_screening_matches_no_delete before delete on screening_matches_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : suppression interdite (screening_matches_aud)';

create trigger trg_ubos_no_update before update on ubos_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : modification interdite (ubos_aud)';

create trigger trg_ubos_no_delete before delete on ubos_aud for each row signal sqlstate '45000' set message_text = 'Journal d''audit en ajout seul : suppression interdite (ubos_aud)';

