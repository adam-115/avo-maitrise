package com.avo.audit.seal;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Transforme un élément du journal en texte canonique (toujours identique pour les mêmes données),
 * qui sert d'entrée au calcul d'empreinte.
 *
 * - une ligne de audit_log : toutes ses colonnes, triées par nom ;
 * - une révision Envers : la ligne audit_revision + toutes les lignes *_aud de cette révision,
 *   table par table et ligne par ligne, dans un ordre déterministe.
 *
 * Les tables *_aud sont découvertes dans le schéma : une table d'historique ajoutée plus tard
 * est couverte automatiquement, sans changer l'empreinte des révisions déjà scellées.
 */
@Component
public class AuditCanonicalizer {

    private static final String NULL = "∅";
    private static final String FIELD_SEP = "\u001F";
    private static final String ROW_SEP = "\u001E";

    private final JdbcTemplate jdbc;

    public AuditCanonicalizer(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** Contenu canonique des lignes audit_log demandées (absentes de la map si supprimées). */
    public Map<Long, String> logContents(Collection<Long> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        Map<Long, String> result = new HashMap<>();
        jdbc.query("select * from audit_log where id in (" + placeholders(ids.size()) + ")",
                rs -> { result.put(rs.getLong("id"), "audit_log" + FIELD_SEP + canonicalRow(rs)); },
                ids.toArray());
        return result;
    }

    /** Contenu canonique des révisions demandées, lignes *_aud comprises (absentes si la révision a été supprimée). */
    public Map<Long, String> revisionContents(Collection<Long> revisionIds) {
        if (revisionIds.isEmpty()) {
            return Map.of();
        }
        Object[] params = revisionIds.toArray();
        String in = placeholders(revisionIds.size());

        Map<Long, String> header = new HashMap<>();
        jdbc.query("select * from audit_revision where id in (" + in + ")",
                rs -> { header.put(rs.getLong("id"), canonicalRow(rs)); }, params);

        // rev -> table -> lignes canoniques
        Map<Long, SortedMap<String, List<String>>> rows = new HashMap<>();
        for (String table : auditTables()) {
            jdbc.query("select * from " + table + " where rev in (" + in + ")", rs -> {
                rows.computeIfAbsent(rs.getLong("rev"), k -> new TreeMap<>())
                        .computeIfAbsent(table, k -> new ArrayList<>())
                        .add(canonicalRow(rs));
            }, params);
        }

        Map<Long, String> result = new HashMap<>();
        for (Map.Entry<Long, String> e : header.entrySet()) {
            StringBuilder sb = new StringBuilder("audit_revision").append(FIELD_SEP).append(e.getValue());
            rows.getOrDefault(e.getKey(), new TreeMap<>()).forEach((table, lines) -> {
                Collections.sort(lines);
                sb.append(ROW_SEP).append(table).append(ROW_SEP).append(String.join(ROW_SEP, lines));
            });
            result.put(e.getKey(), sb.toString());
        }
        return result;
    }

    /** Tables d'historique Envers présentes dans le schéma courant, triées. */
    public List<String> auditTables() {
        return jdbc.queryForList(
                "select table_name from information_schema.tables where table_schema = database() "
                        + "and table_name like '%\\_aud' order by table_name", String.class)
                .stream().filter(t -> t.matches("[a-z0-9_]+")).collect(Collectors.toList());
    }

    static String canonicalRow(ResultSet rs) throws SQLException {
        ResultSetMetaData meta = rs.getMetaData();
        SortedMap<String, String> columns = new TreeMap<>();
        for (int i = 1; i <= meta.getColumnCount(); i++) {
            columns.put(meta.getColumnLabel(i).toLowerCase(Locale.ROOT), normalize(rs.getObject(i)));
        }
        return columns.entrySet().stream().map(c -> c.getKey() + "=" + c.getValue())
                .collect(Collectors.joining(FIELD_SEP));
    }

    static String normalize(Object value) {
        if (value == null) {
            return NULL;
        }
        if (value instanceof byte[] bytes) {
            return HexFormat.of().formatHex(bytes);
        }
        if (value instanceof Boolean b) {
            return b ? "1" : "0";
        }
        if (value instanceof Timestamp ts) {
            return ts.toLocalDateTime().toString();
        }
        if (value instanceof BigDecimal bd) {
            return bd.toPlainString();
        }
        return value.toString();
    }

    private static String placeholders(int n) {
        return String.join(",", Collections.nCopies(n, "?"));
    }
}
