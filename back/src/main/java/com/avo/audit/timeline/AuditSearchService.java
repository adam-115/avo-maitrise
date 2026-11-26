package com.avo.audit.timeline;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

/**
 * Recherche dans le journal pour l'écran d'administration : accès, modifications et alertes
 * sur les comportements inhabituels (téléchargements massifs, accès refusés, activité nocturne).
 */
@Service
public class AuditSearchService {

    public record PageResult<T>(List<T> content, long totalElements, int page, int size) {}

    public record AccessRow(Long id, LocalDateTime time, String user, String action, String actionLabel,
            String resourceType, String resourceLabel, String resourceId, String outcome, String details, String ipAddress) {}

    public record RevisionRow(Long revision, LocalDateTime time, String user, String origin, String ipAddress,
            List<String> changedElements) {}

    public record MassAccessAlert(String user, LocalDateTime hour, long count) {}

    public record UserCount(String user, long count) {}

    public record AlertsReport(LocalDateTime from, int massThreshold, List<MassAccessAlert> massAccess,
            List<AccessRow> refusedAccess, List<UserCount> nightActivity) {}

    private final JdbcTemplate jdbc;
    private final int massThreshold;

    public AuditSearchService(JdbcTemplate jdbc, @Value("${audit.alerts.mass-access-threshold:20}") int massThreshold) {
        this.jdbc = jdbc;
        this.massThreshold = massThreshold;
    }

    public PageResult<AccessRow> searchAccess(String user, String action, String resourceType, String resourceId,
            LocalDate from, LocalDate to, int page, int size) {
        StringBuilder where = new StringBuilder(" where 1 = 1");
        List<Object> params = new ArrayList<>();
        if (notBlank(user)) { where.append(" and username like ?"); params.add("%" + user.trim() + "%"); }
        if (notBlank(action)) { where.append(" and action = ?"); params.add(action); }
        if (notBlank(resourceType)) { where.append(" and resource_type = ?"); params.add(resourceType); }
        if (notBlank(resourceId)) { where.append(" and resource_id = ?"); params.add(resourceId.trim()); }
        if (from != null) { where.append(" and event_time >= ?"); params.add(Timestamp.valueOf(from.atStartOfDay())); }
        if (to != null) { where.append(" and event_time < ?"); params.add(Timestamp.valueOf(to.plusDays(1).atStartOfDay())); }

        Long total = jdbc.queryForObject("select count(*) from audit_log" + where, Long.class, params.toArray());
        List<Object> pageParams = new ArrayList<>(params);
        pageParams.add(size);
        pageParams.add((long) page * size);
        List<AccessRow> rows = jdbc.query("select * from audit_log" + where + " order by id desc limit ? offset ?",
                (rs, n) -> accessRow(rs), pageParams.toArray());
        return new PageResult<>(rows, total == null ? 0 : total, page, size);
    }

    public PageResult<RevisionRow> searchRevisions(String user, LocalDate from, LocalDate to, int page, int size) {
        StringBuilder where = new StringBuilder(" where 1 = 1");
        List<Object> params = new ArrayList<>();
        if (notBlank(user)) { where.append(" and username like ?"); params.add("%" + user.trim() + "%"); }
        if (from != null) { where.append(" and revision_timestamp >= ?"); params.add(epochMillis(from.atStartOfDay())); }
        if (to != null) { where.append(" and revision_timestamp < ?"); params.add(epochMillis(to.plusDays(1).atStartOfDay())); }

        Long total = jdbc.queryForObject("select count(*) from audit_revision" + where, Long.class, params.toArray());
        List<Object> pageParams = new ArrayList<>(params);
        pageParams.add(size);
        pageParams.add((long) page * size);
        List<Map<String, Object>> revisions = jdbc.queryForList(
                "select * from audit_revision" + where + " order by id desc limit ? offset ?", pageParams.toArray());

        // Éléments modifiés dans chaque révision : on interroge chaque table d'historique
        Map<Long, List<String>> changed = new HashMap<>();
        if (!revisions.isEmpty()) {
            List<Object> ids = revisions.stream().map(r -> r.get("id")).toList();
            String in = String.join(",", Collections.nCopies(ids.size(), "?"));
            for (String table : auditTables()) {
                jdbc.query("select rev, revtype, count(*) from " + table + " where rev in (" + in + ") group by rev, revtype",
                        rs -> {
                            String action = switch (rs.getInt(2)) { case 0 -> "création"; case 2 -> "suppression"; default -> "modification"; };
                            changed.computeIfAbsent(rs.getLong(1), k -> new ArrayList<>())
                                    .add(tableLabel(table) + " (" + action + (rs.getLong(3) > 1 ? " ×" + rs.getLong(3) : "") + ")");
                        }, ids.toArray());
            }
        }
        List<RevisionRow> rows = revisions.stream().map(r -> {
            long rev = ((Number) r.get("id")).longValue();
            return new RevisionRow(rev, toLocalDateTime(((Number) r.get("revision_timestamp")).longValue()),
                    (String) r.get("username"), (String) r.get("origin"), (String) r.get("ip_address"),
                    changed.getOrDefault(rev, List.of()));
        }).toList();
        return new PageResult<>(rows, total == null ? 0 : total, page, size);
    }

    /** Alertes sur les N derniers jours. Les heures sont calculées en Java (fuseau du serveur applicatif). */
    public AlertsReport alerts(int days) {
        LocalDateTime from = LocalDate.now().minusDays(days).atStartOfDay();

        Map<String, Map<LocalDateTime, Long>> perUserHour = new HashMap<>();
        Map<String, Long> night = new TreeMap<>();
        jdbc.query("select username, action, event_time from audit_log where event_time >= ? and username <> 'SYSTEME'",
                rs -> {
                    String user = rs.getString(1);
                    LocalDateTime time = rs.getTimestamp(3).toLocalDateTime();
                    String action = rs.getString(2);
                    if ("TELECHARGEMENT".equals(action) || "EXPORT".equals(action) || "ACCES_IA".equals(action)) {
                        perUserHour.computeIfAbsent(user, k -> new HashMap<>())
                                .merge(time.withMinute(0).withSecond(0).withNano(0), 1L, Long::sum);
                    }
                    if (time.getHour() >= 22 || time.getHour() < 6) {
                        night.merge(user, 1L, Long::sum);
                    }
                }, Timestamp.valueOf(from));

        List<MassAccessAlert> mass = new ArrayList<>();
        perUserHour.forEach((user, hours) -> hours.forEach((hour, count) -> {
            if (count >= massThreshold) {
                mass.add(new MassAccessAlert(user, hour, count));
            }
        }));
        mass.sort(Comparator.comparing(MassAccessAlert::count).reversed());

        List<AccessRow> refused = jdbc.query(
                "select * from audit_log where outcome = 'REFUSE' and event_time >= ? order by id desc limit 100",
                (rs, n) -> accessRow(rs), Timestamp.valueOf(from));

        List<UserCount> nightActivity = night.entrySet().stream()
                .map(e -> new UserCount(e.getKey(), e.getValue()))
                .sorted(Comparator.comparing(UserCount::count).reversed()).toList();

        return new AlertsReport(from, massThreshold, mass, refused, nightActivity);
    }

    private static AccessRow accessRow(java.sql.ResultSet rs) throws java.sql.SQLException {
        String type = rs.getString("resource_type");
        String id = rs.getString("resource_id");
        String action = rs.getString("action");
        return new AccessRow(rs.getLong("id"), rs.getTimestamp("event_time").toLocalDateTime(), rs.getString("username"),
                action, AuditLabels.action(action), type,
                AuditLabels.resourceType(type) + (id != null ? " #" + id : ""), id,
                rs.getString("outcome"), rs.getString("details"), rs.getString("ip_address"));
    }

    /**
     * Tables d'historique portant un type de révision. Les tables filles de l'héritage (personnes_physiques_aud,
     * clients_moraux_aud) n'en ont pas : leur table parente (clients_aud) est déjà comptée.
     */
    private List<String> auditTables() {
        return jdbc.queryForList("select table_name from information_schema.columns where table_schema = database() "
                + "and column_name = 'revtype' and table_name like '%\\_aud' order by table_name", String.class)
                .stream().filter(t -> t.matches("[a-z0-9_]+")).toList();
    }

    private static final Map<String, String> TABLE_LABELS = Map.ofEntries(
            Map.entry("clients_aud", "Client"), Map.entry("personnes_physiques_aud", "Personne physique"),
            Map.entry("clients_moraux_aud", "Personne morale"), Map.entry("dossiers_aud", "Dossier"),
            Map.entry("dossier_parties_aud", "Partie au dossier"), Map.entry("dossier_intervenants_aud", "Intervenant"),
            Map.entry("dossier_documents_aud", "Pièce du dossier"), Map.entry("documents_aud", "Document"),
            Map.entry("invoice_aud", "Facture"), Map.entry("ubos_aud", "Bénéficiaire effectif"),
            Map.entry("screening_execution_aud", "Filtrage sanctions / PPE"), Map.entry("screening_matches_aud", "Alerte LCB-FT"),
            Map.entry("client_diligence_status_aud", "Statut de diligence"),
            Map.entry("diligence_form_result_aud", "Formulaire de diligence"),
            Map.entry("diligence_form_result_field_result_aud", "Lien réponse / formulaire"),
            Map.entry("field_result_aud", "Réponse de diligence"), Map.entry("form_config_aud", "Modèle de formulaire"),
            Map.entry("field_config_aud", "Question de formulaire"), Map.entry("field_option_aud", "Option de question"),
            Map.entry("form_config_field_config_aud", "Lien question / formulaire"),
            Map.entry("field_config_field_option_aud", "Lien option / question"));

    private static String tableLabel(String table) {
        return TABLE_LABELS.getOrDefault(table, table);
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

    private static long epochMillis(LocalDateTime time) {
        return time.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
    }

    private static LocalDateTime toLocalDateTime(long epochMillis) {
        return LocalDateTime.ofInstant(Instant.ofEpochMilli(epochMillis), ZoneId.systemDefault());
    }
}
