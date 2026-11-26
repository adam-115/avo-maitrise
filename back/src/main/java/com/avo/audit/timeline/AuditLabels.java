package com.avo.audit.timeline;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/** Libellés lisibles (pour un contrôleur, pas pour un développeur) des types, actions, champs et valeurs. */
final class AuditLabels {

    private AuditLabels() {}

    static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    /** Colonnes techniques ou trop volumineuses, jamais affichées dans le détail des modifications. */
    static final Set<String> HIDDEN_COLUMNS = Set.of(
            "id", "rev", "revtype", "raw_response", "updated_at", "last_update_date", "version",
            "minio_object_id", "url_stockage", "client_version_at_review", "yente_last_update");

    static final Map<String, String> RESOURCE_TYPES = Map.ofEntries(
            Map.entry("CLIENT", "Client"),
            Map.entry("DOSSIER", "Dossier"),
            Map.entry("DOCUMENT", "Document"),
            Map.entry("FACTURE", "Facture"),
            Map.entry("ALERTE_LCBFT", "Alerte LCB-FT"),
            Map.entry("FILTRAGE_LCBFT", "Filtrage sanctions / PPE"),
            Map.entry("DILIGENCE", "Formulaire de diligence"),
            Map.entry("REPONSE_DILIGENCE", "Réponse de diligence"),
            Map.entry("STATUT_DILIGENCE", "Statut de diligence"),
            Map.entry("UBO", "Bénéficiaire effectif"),
            Map.entry("PARTIE", "Partie au dossier"),
            Map.entry("INTERVENANT", "Intervenant du dossier"),
            Map.entry("JOURNAL_AUDIT", "Journal d'audit"));

    static final Map<String, String> ACTIONS = Map.ofEntries(
            Map.entry("CREATION", "Création"),
            Map.entry("MODIFICATION", "Modification"),
            Map.entry("SUPPRESSION", "Suppression"),
            Map.entry("AJOUT", "Ajout"),
            Map.entry("RETRAIT", "Retrait"),
            Map.entry("CONSULTATION", "Consultation"),
            Map.entry("TELECHARGEMENT", "Téléchargement"),
            Map.entry("EXPORT", "Export"),
            Map.entry("ACCES_IA", "Lecture par l'IA"),
            Map.entry("DECLENCHEMENT_FILTRAGE", "Lancement d'un filtrage"));

    static final Map<String, String> FIELDS = Map.ofEntries(
            Map.entry("email", "E-mail"), Map.entry("telephone", "Téléphone"), Map.entry("adresse", "Adresse"),
            Map.entry("pays", "Pays"), Map.entry("client_status", "Statut du client"),
            Map.entry("secteur_activite", "Secteur d'activité"), Map.entry("created_at", "Date de création"),
            Map.entry("nom", "Nom"), Map.entry("prenom", "Prénom"), Map.entry("nationalite", "Nationalité"),
            Map.entry("cin", "N° de pièce d'identité"), Map.entry("date_naissance", "Date de naissance"),
            Map.entry("nom_commercial", "Raison sociale"), Map.entry("forme_juridique", "Forme juridique"),
            Map.entry("numero_registre_commerce", "N° registre du commerce"), Map.entry("numero_id_fiscal", "N° fiscal"),
            Map.entry("nom_representant_legal", "Nom du représentant légal"),
            Map.entry("prenom_representant_legal", "Prénom du représentant légal"),
            Map.entry("nationalite_representant_legal", "Nationalité du représentant légal"),
            Map.entry("cin_representant_legal", "Pièce d'identité du représentant légal"),
            Map.entry("date_naissance_representant_legal", "Date de naissance du représentant légal"),
            Map.entry("status", "Statut"), Map.entry("reviewer_comment", "Justification de la décision"),
            Map.entry("reviewed_by", "Décideur déclaré"), Map.entry("reviewed_at", "Date de la décision"),
            Map.entry("score", "Score de correspondance"), Map.entry("target_name", "Personne correspondante"),
            Map.entry("match_reason", "Motif de correspondance"), Map.entry("yente_id", "Identifiant sur la liste"),
            Map.entry("execution_message", "Message"), Map.entry("full_name", "Nom complet"),
            Map.entry("percentage_of_ownership", "Pourcentage de détention"), Map.entry("role_in_company", "Fonction"),
            Map.entry("aml_analysis_status", "Statut LCB-FT"), Map.entry("aml_target_entity_name", "Entité contrôlée"),
            Map.entry("date_of_birth", "Date de naissance"), Map.entry("nationality", "Nationalité"),
            Map.entry("titre", "Titre"), Map.entry("description", "Description"),
            Map.entry("reference_interne", "Référence interne"), Map.entry("responsable_id", "Responsable"),
            Map.entry("statut_id", "Statut du dossier"), Map.entry("priorite_id", "Priorité"),
            Map.entry("domaine_juridique", "Domaine juridique"), Map.entry("date_ouverture", "Date d'ouverture"),
            Map.entry("date_cloture", "Date de clôture"), Map.entry("role", "Rôle"), Map.entry("client_id", "Client / partie"),
            Map.entry("dossier_id", "Dossier"), Map.entry("ubo_id", "Bénéficiaire effectif"),
            Map.entry("nom_fichier", "Nom du fichier"), Map.entry("filename", "Fichier"), Map.entry("title", "Titre"),
            Map.entry("type_document", "Type de document"), Map.entry("est_valide", "Valide"),
            Map.entry("date_upload", "Date de dépôt"), Map.entry("tags", "Mots-clés"),
            Map.entry("numero_facture", "N° de facture"), Map.entry("total_amount", "Montant TTC"),
            Map.entry("subtotal_amount", "Montant HT"), Map.entry("tax_rate", "Taux de TVA"),
            Map.entry("due_date", "Échéance"), Map.entry("issue_date", "Date d'émission"),
            Map.entry("dunning_level", "Niveau de relance"), Map.entry("is_disputed", "Contestée"),
            Map.entry("note", "Note"), Map.entry("value", "Réponse"), Map.entry("enabled", "Actif"),
            Map.entry("form_config_id", "Formulaire"), Map.entry("result_id", "Résultat"),
            Map.entry("creation_date", "Date de création"), Map.entry("field_config_id", "Question"),
            Map.entry("field_option_id", "Option choisie"), Map.entry("screening_execution_id", "Filtrage"));

    static String resourceType(String type) {
        return RESOURCE_TYPES.getOrDefault(type, type);
    }

    static String action(String action) {
        return ACTIONS.getOrDefault(action, action);
    }

    static String field(String column) {
        String label = FIELDS.get(column);
        if (label != null) {
            return label;
        }
        String human = column.replace('_', ' ');
        return human.isEmpty() ? column : Character.toUpperCase(human.charAt(0)) + human.substring(1);
    }

    /** Valeur affichable (null = champ vide). */
    static String value(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Timestamp ts) {
            LocalDateTime ldt = ts.toLocalDateTime();
            return ldt.toLocalTime().toSecondOfDay() == 0 ? ldt.format(DATE) : ldt.format(DATE_TIME);
        }
        if (value instanceof LocalDateTime ldt) {
            return ldt.format(DATE_TIME);
        }
        if (value instanceof java.sql.Date d) {
            return d.toLocalDate().format(DATE);
        }
        if (value instanceof LocalDate d) {
            return d.format(DATE);
        }
        if (value instanceof Boolean b) {
            return b ? "Oui" : "Non";
        }
        if (value instanceof byte[] bytes) {
            return bytes.length == 1 ? (bytes[0] != 0 ? "Oui" : "Non") : "(binaire)";
        }
        if (value instanceof BigDecimal bd) {
            return bd.stripTrailingZeros().toPlainString();
        }
        String text = value.toString();
        return text.length() > 300 ? text.substring(0, 300) + "…" : text;
    }

    static String lower(String s) {
        return s == null ? null : s.toLowerCase(Locale.ROOT);
    }
}
