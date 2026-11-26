package com.avo.audit.timeline;

import com.avo.audit.timeline.TimelineEntry.FieldChange;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Reconstitue la chronologie d'audit complète d'un client ou d'un dossier, à partir :
 * - de l'historique Envers (*_aud) : création, modification champ par champ, suppression ;
 * - du journal des accès (audit_log) : consultations, téléchargements, exports, lectures par l'IA.
 *
 * Pour un client, la chronologie inclut aussi ses alertes et filtrages LCB-FT, ses diligences (statuts,
 * formulaires et réponses), ses bénéficiaires effectifs, ses documents et l'ouverture de ses dossiers :
 * c'est ce qui permet de prouver que la vigilance a été exercée AVANT l'acceptation d'une mission.
 */
@Service
public class AuditTimelineService {

    public static final int MAX_ENTRIES = 3000;

    /** Une famille d'éléments historisés rattachés au client ou au dossier consulté. */
    private record Source(String type, String table, String where, int paramCount, String nameColumns, List<String> childTables) {
        Source(String type, String table, String where, int paramCount, String nameColumns) {
            this(type, table, where, paramCount, nameColumns, List.of());
        }
    }

    private static final List<Source> CLIENT_SOURCES = List.of(
            new Source("CLIENT", "clients_aud", "a.id = ?", 1, "nom,prenom,nom_commercial,email",
                    List.of("personnes_physiques_aud", "clients_moraux_aud")),
            new Source("FILTRAGE_LCBFT", "screening_execution_aud", "a.client_id = ?", 1, "status"),
            new Source("ALERTE_LCBFT", "screening_matches_aud", "a.client_id = ?", 1, "target_name"),
            new Source("STATUT_DILIGENCE", "client_diligence_status_aud", "a.client_id = ?", 1, "status"),
            new Source("DILIGENCE", "diligence_form_result_aud", "a.client_id = ?", 1, "form_config_id"),
            new Source("REPONSE_DILIGENCE", "field_result_aud",
                    "a.id in (select j.id from diligence_form_result_field_result_aud j where j.diligence_form_result_id in "
                            + "(select d.id from diligence_form_result_aud d where d.client_id = ?))", 1, "field_config_id"),
            new Source("UBO", "ubos_aud", "a.client_id = ?", 1, "full_name"),
            new Source("DOCUMENT", "documents_aud", "a.client_id = ?", 1, "nom_fichier,title,filename"),
            new Source("DOSSIER", "dossiers_aud", "a.client_id = ?", 1, "titre,reference_interne"));

    private static final List<Source> DOSSIER_SOURCES = List.of(
            new Source("DOSSIER", "dossiers_aud", "a.id = ?", 1, "titre,reference_interne"),
            new Source("PARTIE", "dossier_parties_aud", "a.dossier_id = ?", 1, "role"),
            new Source("DOCUMENT", "documents_aud",
                    "(a.dossier_id = ? or a.id in (select j.document_id from dossier_documents_aud j where j.dossier_id = ?))",
                    2, "nom_fichier,title,filename"),
            new Source("FACTURE", "invoice_aud", "a.dossier_id = ?", 1, "numero_facture"));

    /** Type de ressource du journal des accès correspondant à chaque source. */
    private static final Map<String, String> ACCESS_TYPE = Map.of(
            "CLIENT", "CLIENT", "ALERTE_LCBFT", "ALERTE_LCBFT", "FILTRAGE_LCBFT", "FILTRAGE_LCBFT",
            "DILIGENCE", "DILIGENCE", "UBO", "UBO", "DOCUMENT", "DOCUMENT", "DOSSIER", "DOSSIER", "FACTURE", "FACTURE");

    private final JdbcTemplate jdbc;

    public AuditTimelineService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** @param scope CLIENT ou DOSSIER */
    public List<TimelineEntry> timeline(String scope, long id) {
        List<Source> sources = switch (scope) {
            case "CLIENT" -> CLIENT_SOURCES;
            case "DOSSIER" -> DOSSIER_SOURCES;
            default -> throw new IllegalArgumentException("Périmètre inconnu : " + scope + " (CLIENT ou DOSSIER)");
        };

        List<TimelineEntry> entries = new ArrayList<>();
        Map<String, Set<String>> accessKeys = new LinkedHashMap<>();
        accessKeys.computeIfAbsent(scope, k -> new LinkedHashSet<>()).add(String.valueOf(id));

        for (Source source : sources) {
            Map<String, Set<String>> ids = new HashMap<>();
            entries.addAll(modifications(source, id, ids));
            String accessType = ACCESS_TYPE.get(source.type());
            if (accessType != null) {
                accessKeys.computeIfAbsent(accessType, k -> new LinkedHashSet<>())
                        .addAll(ids.getOrDefault(source.type(), Set.of()));
            }
        }
        if ("DOSSIER".equals(scope)) {
            entries.addAll(intervenants(id));
        }
        entries.addAll(accesses(accessKeys));

        entries.sort(Comparator.comparing(TimelineEntry::time, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(TimelineEntry::reference, Comparator.nullsLast(Comparator.reverseOrder())));
        return entries.size() > MAX_ENTRIES ? entries.subList(0, MAX_ENTRIES) : entries;
    }

    // ------------------------------------------------------------------ Modifications (Envers)

    private List<TimelineEntry> modifications(Source source, long id, Map<String, Set<String>> collectedIds) {
        Object[] params = Collections.nCopies(source.paramCount(), id).toArray();
        String sql = "select a.*, r.username as _username, r.revision_timestamp as _ts, r.ip_address as _ip, "
                + "r.origin as _origin from " + source.table() + " a join audit_revision r on r.id = a.rev where "
                + source.where() + " order by a.id, a.rev";
        List<Map<String, Object>> rows = jdbc.query(sql, (rs, n) -> rowToMap(rs), params);
        if (rows.isEmpty()) {
            return List.of();
        }
        mergeChildTables(source, rows);

        Map<Object, List<Map<String, Object>>> byEntity = rows.stream()
                .collect(Collectors.groupingBy(r -> r.get("id"), LinkedHashMap::new, Collectors.toList()));
        collectedIds.put(source.type(), byEntity.keySet().stream().map(String::valueOf).collect(Collectors.toSet()));

        List<TimelineEntry> result = new ArrayList<>();
        for (Map.Entry<Object, List<Map<String, Object>>> entity : byEntity.entrySet()) {
            Map<String, Object> previous = null;
            String label = resourceLabel(source, entity.getKey(), entity.getValue().get(entity.getValue().size() - 1));
            for (Map<String, Object> row : entity.getValue()) {
                int revtype = ((Number) row.getOrDefault("revtype", 1)).intValue();
                String action = switch (revtype) {
                    case 0 -> "CREATION";
                    case 2 -> "SUPPRESSION";
                    default -> "MODIFICATION";
                };
                List<FieldChange> changes = diff(revtype == 0 || previous == null ? null : previous, row, revtype);
                if (revtype == 1 && previous != null && changes.isEmpty()) {
                    previous = row;
                    continue; // révision sans changement visible (ex. seul updated_at a bougé)
                }
                result.add(new TimelineEntry(
                        toLocalDateTime(row.get("_ts")), (String) row.get("_username"), (String) row.get("_ip"),
                        (String) row.get("_origin"), "MODIFICATION", action, source.type(),
                        String.valueOf(entity.getKey()), label, summary(action, source, changes),
                        changes, null, ((Number) row.get("rev")).longValue()));
                previous = row;
            }
        }
        if ("REPONSE_DILIGENCE".equals(source.type())) {
            Map<String, String> questionByAnswer = new HashMap<>();
            byEntity.forEach((answerId, versions) -> versions.stream().map(v -> v.get("field_config_id"))
                    .filter(Objects::nonNull).reduce((a, b) -> b)
                    .ifPresent(q -> questionByAnswer.put(String.valueOf(answerId), String.valueOf(q))));
            return resolveQuestionLabels(result, questionByAnswer);
        }
        return result;
    }

    /** Héritage JOINED (client → personne physique / personne morale) : on fusionne les colonnes des tables filles. */
    private void mergeChildTables(Source source, List<Map<String, Object>> rows) {
        for (String child : source.childTables()) {
            Set<Object> ids = rows.stream().map(r -> r.get("id")).collect(Collectors.toSet());
            String in = String.join(",", Collections.nCopies(ids.size(), "?"));
            Map<String, Map<String, Object>> childRows = new HashMap<>();
            jdbc.query("select * from " + child + " where id in (" + in + ")", rs -> {
                Map<String, Object> m = rowToMap(rs);
                childRows.put(m.get("id") + "#" + m.get("rev"), m);
            }, ids.toArray());
            for (Map<String, Object> row : rows) {
                Map<String, Object> extra = childRows.get(row.get("id") + "#" + row.get("rev"));
                if (extra != null) {
                    extra.forEach((k, v) -> { if (!"id".equals(k) && !"rev".equals(k)) row.put(k, v); });
                }
            }
        }
    }

    private static List<FieldChange> diff(Map<String, Object> previous, Map<String, Object> current, int revtype) {
        List<FieldChange> changes = new ArrayList<>();
        for (Map.Entry<String, Object> e : current.entrySet()) {
            String column = e.getKey();
            if (column.startsWith("_") || AuditLabels.HIDDEN_COLUMNS.contains(column)) {
                continue;
            }
            String after = AuditLabels.value(e.getValue());
            if (previous == null) {
                // Création / suppression / premier état connu : on liste les champs renseignés
                if (after != null && !after.isBlank()) {
                    changes.add(revtype == 2
                            ? new FieldChange(column, AuditLabels.field(column), after, null)
                            : new FieldChange(column, AuditLabels.field(column), null, after));
                }
            } else {
                String before = AuditLabels.value(previous.get(column));
                if (!Objects.equals(before, after)) {
                    changes.add(new FieldChange(column, AuditLabels.field(column), before, after));
                }
            }
        }
        changes.sort(Comparator.comparing(FieldChange::label));
        return changes;
    }

    private static String summary(String action, Source source, List<FieldChange> changes) {
        String what = AuditLabels.resourceType(source.type());
        if (!"MODIFICATION".equals(action)) {
            return AuditLabels.action(action) + " : " + what;
        }
        String fields = changes.stream().map(FieldChange::label).limit(4).collect(Collectors.joining(", "));
        return what + " modifié(e) : " + fields + (changes.size() > 4 ? "…" : "");
    }

    private static String resourceLabel(Source source, Object id, Map<String, Object> latestRow) {
        String name = Arrays.stream(source.nameColumns().split(","))
                .map(latestRow::get).filter(Objects::nonNull).map(String::valueOf)
                .filter(s -> !s.isBlank()).limit(2).collect(Collectors.joining(" "));
        return AuditLabels.resourceType(source.type()) + " #" + id + (name.isBlank() ? "" : " – " + name);
    }

    /** Les réponses de diligence affichent l'intitulé de la question plutôt que son identifiant. */
    private List<TimelineEntry> resolveQuestionLabels(List<TimelineEntry> entries, Map<String, String> questionByAnswer) {
        Set<String> questionIds = new HashSet<>(questionByAnswer.values());
        if (questionIds.isEmpty()) {
            return entries;
        }
        Map<String, String> labels = new HashMap<>();
        jdbc.query("select id, label from field_config where id in ("
                        + String.join(",", Collections.nCopies(questionIds.size(), "?")) + ")",
                rs -> { labels.put(rs.getString(1), rs.getString(2)); }, questionIds.toArray());
        return entries.stream().map(e -> {
            String question = labels.get(questionByAnswer.get(e.resourceId()));
            if (question == null) {
                return e;
            }
            return new TimelineEntry(e.time(), e.user(), e.ipAddress(), e.origin(), e.category(), e.action(),
                    e.resourceType(), e.resourceId(), "Réponse de diligence – « " + question + " »", e.summary(),
                    e.changes(), e.outcome(), e.reference());
        }).collect(Collectors.toList());
    }

    /** Intervenants ajoutés / retirés du dossier (qui a eu accès au dossier). */
    private List<TimelineEntry> intervenants(long dossierId) {
        return jdbc.query("select a.intervenant_id, a.revtype, a.rev, r.username, r.revision_timestamp, r.ip_address, r.origin "
                        + "from dossier_intervenants_aud a join audit_revision r on r.id = a.rev "
                        + "where a.dossier_id = ? order by a.rev",
                (rs, n) -> {
                    boolean added = rs.getInt("revtype") != 2;
                    String who = rs.getString("intervenant_id");
                    return new TimelineEntry(toLocalDateTime(rs.getLong("revision_timestamp")), rs.getString("username"),
                            rs.getString("ip_address"), rs.getString("origin"), "MODIFICATION",
                            added ? "AJOUT" : "RETRAIT", "INTERVENANT", who, "Intervenant " + who,
                            (added ? "Intervenant ajouté au dossier : " : "Intervenant retiré du dossier : ") + who,
                            List.of(), null, rs.getLong("rev"));
                }, dossierId);
    }

    // ------------------------------------------------------------------ Accès (audit_log)

    private List<TimelineEntry> accesses(Map<String, Set<String>> keys) {
        List<TimelineEntry> result = new ArrayList<>();
        for (Map.Entry<String, Set<String>> e : keys.entrySet()) {
            if (e.getValue().isEmpty()) {
                continue;
            }
            List<Object> params = new ArrayList<>();
            params.add(e.getKey());
            params.addAll(e.getValue());
            String in = String.join(",", Collections.nCopies(e.getValue().size(), "?"));
            result.addAll(jdbc.query("select * from audit_log where resource_type = ? and resource_id in (" + in
                    + ") order by id desc limit " + MAX_ENTRIES, (rs, n) -> {
                String type = rs.getString("resource_type");
                String action = rs.getString("action");
                String details = rs.getString("details");
                String resourceId = rs.getString("resource_id");
                return new TimelineEntry(rs.getTimestamp("event_time").toLocalDateTime(), rs.getString("username"),
                        rs.getString("ip_address"), null, "ACCES", action, type, resourceId,
                        AuditLabels.resourceType(type) + (resourceId != null ? " #" + resourceId : ""),
                        AuditLabels.action(action) + (details != null ? " : " + details : ""),
                        List.of(), rs.getString("outcome"), rs.getLong("id"));
            }, params.toArray()));
        }
        return result;
    }

    // ------------------------------------------------------------------ Utilitaires

    private static Map<String, Object> rowToMap(ResultSet rs) throws SQLException {
        ResultSetMetaData meta = rs.getMetaData();
        Map<String, Object> row = new LinkedHashMap<>();
        for (int i = 1; i <= meta.getColumnCount(); i++) {
            // getObject() renvoie un DATETIME sans conversion de fuseau (heure brute de la base, souvent UTC) ;
            // getTimestamp() applique le fuseau de connexion, comme Hibernate à l'écriture : heure locale correcte.
            Object value = meta.getColumnType(i) == java.sql.Types.TIMESTAMP ? rs.getTimestamp(i) : rs.getObject(i);
            row.put(AuditLabels.lower(meta.getColumnLabel(i)), value);
        }
        return row;
    }

    private static LocalDateTime toLocalDateTime(Object epochMillisOrTimestamp) {
        if (epochMillisOrTimestamp instanceof Number n) {
            return LocalDateTime.ofInstant(Instant.ofEpochMilli(n.longValue()), ZoneId.systemDefault());
        }
        if (epochMillisOrTimestamp instanceof Timestamp ts) {
            return ts.toLocalDateTime();
        }
        return null;
    }

}
