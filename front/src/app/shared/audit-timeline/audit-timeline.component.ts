import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AuditScope, AuditService, AuditTimelineEntry } from '../../services/audit.service';
import { KeycloakService } from '../../services/keycloak.service';

/** Rôles autorisés à consulter le journal d'audit (alignés sur SecurityConfig côté serveur). */
export const AUDIT_ROLES = ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'];

export function canViewAudit(keycloak: KeycloakService): boolean {
  return keycloak.getUserRoles().some(r => AUDIT_ROLES.includes(r));
}

/**
 * Chronologie d'audit d'un client ou d'un dossier : modifications (avant / après) et accès.
 * Utilisable directement (scope + resourceId) ou comme onglet de dossier (dossierId fourni par le parent).
 */
@Component({
  selector: 'app-audit-timeline',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './audit-timeline.component.html'
})
export class AuditTimelineComponent implements OnChanges {
  private auditService = inject(AuditService);

  @Input() scope: AuditScope = 'DOSSIER';
  @Input() resourceId: number | string | null = null;
  /** Fourni automatiquement par la fiche dossier quand le composant est affiché comme onglet. */
  @Input() set dossierId(value: number | string | null) {
    if (value) {
      this.scope = 'DOSSIER';
      this.resourceId = value;
    }
  }
  /** Chargement différé (fiche client) : on n'interroge le serveur qu'au clic sur « Afficher ». */
  @Input() deferred = false;

  entries: AuditTimelineEntry[] = [];
  loaded = false;
  loading = false;
  exporting = false;
  error: string | null = null;
  expanded = new Set<number>();

  filter: 'ALL' | 'MODIFICATION' | 'ACCES' = 'ALL';
  search = '';

  private loadedKey: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.deferred) {
      this.load();
    }
  }

  load(): void {
    if (!this.resourceId) {
      return;
    }
    const key = `${this.scope}#${this.resourceId}`;
    if (key === this.loadedKey || this.loading) {
      return;
    }
    this.loading = true;
    this.error = null;
    this.auditService.timeline(this.scope, this.resourceId).subscribe({
      next: entries => {
        this.entries = entries;
        this.loaded = true;
        this.loading = false;
        this.loadedKey = key;
      },
      error: err => {
        this.loading = false;
        this.error = err?.status === 403 ? 'AUDIT.FORBIDDEN' : 'AUDIT.LOAD_ERROR';
      }
    });
  }

  reload(): void {
    this.loadedKey = null;
    this.load();
  }

  exportPdf(): void {
    if (!this.resourceId) {
      return;
    }
    this.exporting = true;
    this.auditService.timelinePdf(this.scope, this.resourceId).subscribe({
      next: blob => {
        this.exporting = false;
        const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
        AuditService.download(blob, `journal-audit-${this.scope.toLowerCase()}-${this.resourceId}-${stamp}.pdf`);
      },
      error: () => {
        this.exporting = false;
        this.error = 'AUDIT.EXPORT_ERROR';
      }
    });
  }

  get filtered(): AuditTimelineEntry[] {
    const term = this.search.trim().toLowerCase();
    return this.entries.filter(e =>
      (this.filter === 'ALL' || e.category === this.filter) &&
      (!term || [e.user, e.resourceLabel, e.summary, e.action, ...e.changes.map(c => `${c.label} ${c.before} ${c.after}`)]
        .some(v => (v || '').toLowerCase().includes(term))));
  }

  get modificationCount(): number {
    return this.entries.filter(e => e.category === 'MODIFICATION').length;
  }

  get accessCount(): number {
    return this.entries.filter(e => e.category === 'ACCES').length;
  }

  toggle(index: number): void {
    this.expanded.has(index) ? this.expanded.delete(index) : this.expanded.add(index);
  }

  badgeClass(e: AuditTimelineEntry): string {
    if (e.outcome === 'REFUSE' || e.outcome === 'ECHEC') return 'bg-red-50 text-red-700 border-red-200';
    switch (e.action) {
      case 'CREATION':
      case 'AJOUT': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'SUPPRESSION':
      case 'RETRAIT': return 'bg-red-50 text-red-700 border-red-200';
      case 'MODIFICATION': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'TELECHARGEMENT':
      case 'EXPORT': return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'ACCES_IA': return 'bg-sky-50 text-sky-700 border-sky-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  }

  dotClass(e: AuditTimelineEntry): string {
    return e.category === 'MODIFICATION' ? 'bg-pink-500' : 'bg-slate-300';
  }
}
