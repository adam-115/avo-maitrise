package com.avo.audit;

import org.hibernate.envers.RevisionListener;

/** Renseigne l'auteur, l'IP et l'origine de chaque révision Envers. */
public class AuditRevisionListener implements RevisionListener {

    @Override
    public void newRevision(Object revisionEntity) {
        AuditRevision revision = (AuditRevision) revisionEntity;
        revision.setUsername(AuditContext.currentUser());
        revision.setIpAddress(AuditContext.currentIp());
        revision.setOrigin(AuditContext.currentOrigin());
    }
}
