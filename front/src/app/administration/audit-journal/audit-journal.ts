import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import {
  AuditAccessRow, AuditAlerts, AuditIntegrityReport, AuditPage, AuditRevisionRow, AuditSearchFilters, AuditService
} from '../../services/audit.service';

type AuditTab = 'integrity' | 'access' | 'revisions' | 'alerts';

/** Écran d'administration du journal d'audit : intégrité, recherche des accès et des modifications, alertes. */
@Component({
  selector: 'app-audit-journal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './audit-journal.html'
})
export class AuditJournal implements OnInit {
  private auditService = inject(AuditService);

  tab: AuditTab = 'integrity';
  error: string | null = null;

  // Intégrité
  integrity: AuditIntegrityReport | null = null;
  verifying = false;
  sealing = false;
  sealedMessage: number | null = null;

  // Accès
  accessFilters: AuditSearchFilters = {};
  accessPage: AuditPage<AuditAccessRow> | null = null;
  accessLoading = false;

  // Modifications
  revisionFilters: AuditSearchFilters = {};
  revisionPage: AuditPage<AuditRevisionRow> | null = null;
  revisionLoading = false;

  // Alertes
  alertDays = 7;
  alerts: AuditAlerts | null = null;
  alertsLoading = false;

  readonly pageSize = 25;
  readonly actions = ['CONSULTATION', 'TELECHARGEMENT', 'EXPORT', 'ACCES_IA', 'DECLENCHEMENT_FILTRAGE'];
  readonly resourceTypes = ['CLIENT', 'DOSSIER', 'DOCUMENT', 'FACTURE', 'ALERTE_LCBFT', 'FILTRAGE_LCBFT', 'DILIGENCE', 'UBO', 'JOURNAL_AUDIT'];

  ngOnInit(): void {
    this.verify();
  }

  select(tab: AuditTab): void {
    this.tab = tab;
    this.error = null;
    if (tab === 'access' && !this.accessPage) this.searchAccess(0);
    if (tab === 'revisions' && !this.revisionPage) this.searchRevisions(0);
    if (tab === 'alerts' && !this.alerts) this.loadAlerts();
  }

  verify(): void {
    this.verifying = true;
    this.auditService.verifyIntegrity().subscribe({
      next: report => { this.integrity = report; this.verifying = false; },
      error: err => this.fail(err, () => this.verifying = false)
    });
  }

  sealNow(): void {
    this.sealing = true;
    this.auditService.sealNow().subscribe({
      next: res => { this.sealing = false; this.sealedMessage = res.sealed; this.verify(); },
      error: err => this.fail(err, () => this.sealing = false)
    });
  }

  searchAccess(page: number): void {
    this.accessLoading = true;
    this.auditService.searchAccess(this.accessFilters, page, this.pageSize).subscribe({
      next: res => { this.accessPage = res; this.accessLoading = false; },
      error: err => this.fail(err, () => this.accessLoading = false)
    });
  }

  resetAccess(): void {
    this.accessFilters = {};
    this.searchAccess(0);
  }

  searchRevisions(page: number): void {
    this.revisionLoading = true;
    this.auditService.searchRevisions(this.revisionFilters, page, this.pageSize).subscribe({
      next: res => { this.revisionPage = res; this.revisionLoading = false; },
      error: err => this.fail(err, () => this.revisionLoading = false)
    });
  }

  resetRevisions(): void {
    this.revisionFilters = {};
    this.searchRevisions(0);
  }

  loadAlerts(): void {
    this.alertsLoading = true;
    this.auditService.alerts(this.alertDays).subscribe({
      next: res => { this.alerts = res; this.alertsLoading = false; },
      error: err => this.fail(err, () => this.alertsLoading = false)
    });
  }

  /** Depuis une alerte : afficher les accès de cet utilisateur. */
  showUserAccess(user: string): void {
    this.accessFilters = { user };
    this.tab = 'access';
    this.searchAccess(0);
  }

  totalPages(page: AuditPage<unknown> | null): number {
    return page ? Math.max(1, Math.ceil(page.totalElements / page.size)) : 1;
  }

  get alertCount(): number {
    return this.alerts ? this.alerts.massAccess.length + this.alerts.refusedAccess.length : 0;
  }

  outcomeClass(outcome: string): string {
    return outcome === 'SUCCES' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200';
  }

  private fail(err: any, done: () => void): void {
    done();
    this.error = err?.status === 403 ? 'AUDIT.FORBIDDEN' : 'AUDIT.LOAD_ERROR';
  }
}
