package com.avo.audit.seal;

/** Les deux chaînes de sceaux : journal des consultations et révisions Envers (modifications). */
public enum SealChain {

    CONSULTATIONS("audit_log", "audit_log_seal", "log_id",
            "select l.id from audit_log l left join audit_log_seal s on s.log_id = l.id "
                    + "where s.log_id is null and l.event_time < ? order by l.id limit ?"),

    MODIFICATIONS("audit_revision", "audit_revision_seal", "revision_id",
            "select r.id from audit_revision r left join audit_revision_seal s on s.revision_id = r.id "
                    + "where s.revision_id is null and r.revision_timestamp < ? order by r.id limit ?");

    final String sourceTable;
    final String sealTable;
    final String itemColumn;
    final String pendingQuery;

    SealChain(String sourceTable, String sealTable, String itemColumn, String pendingQuery) {
        this.sourceTable = sourceTable;
        this.sealTable = sealTable;
        this.itemColumn = itemColumn;
        this.pendingQuery = pendingQuery;
    }
}
