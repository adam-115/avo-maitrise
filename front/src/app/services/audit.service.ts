import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type AuditScope = 'CLIENT' | 'DOSSIER';

export interface AuditFieldChange {
  field: string;
  label: string;
  before: string | null;
  after: string | null;
}

export interface AuditTimelineEntry {
  time: string;
  user: string | null;
  ipAddress: string | null;
  origin: string | null;
  category: 'MODIFICATION' | 'ACCES';
  action: string;
  resourceType: string;
  resourceId: string | null;
  resourceLabel: string;
  summary: string;
  changes: AuditFieldChange[];
  outcome: string | null;
  reference: number | null;
}

export interface AuditPage<T> {
  content: T[];
  totalElements: number;
  page: number;
  size: number;
}

export interface AuditAccessRow {
  id: number;
  time: string;
  user: string;
  action: string;
  actionLabel: string;
  resourceType: string;
  resourceLabel: string;
  resourceId: string | null;
  outcome: string;
  details: string | null;
  ipAddress: string | null;
}

export interface AuditRevisionRow {
  revision: number;
  time: string;
  user: string;
  origin: string;
  ipAddress: string | null;
  changedElements: string[];
}

export interface AuditAlerts {
  from: string;
  massThreshold: number;
  massAccess: { user: string; hour: string; count: number }[];
  refusedAccess: AuditAccessRow[];
  nightActivity: { user: string; count: number }[];
}

export interface AuditAnomaly {
  type: string;
  chain: string | null;
  itemId: number | null;
  seq: number | null;
  description: string;
}

export interface AuditIntegrityReport {
  status: 'INTACT' | 'ANOMALIES';
  verifiedAt: string;
  chains: { chain: string; sealedItems: number; pendingItems: number; lastSeq: number | null; lastHash: string | null }[];
  anomalies: AuditAnomaly[];
  anomalyCount: number;
  keyConfigured: boolean;
  currentAlgorithm: string;
  protectedTables: number;
  unprotectedTables: number;
}

export interface AuditSearchFilters {
  user?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  from?: string;
  to?: string;
}

/** Journal d'audit : réservé aux administrateurs côté serveur (/api/audit/**). */
@Injectable({ providedIn: 'root' })
export class AuditService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}audit`;

  timeline(scope: AuditScope, id: number | string): Observable<AuditTimelineEntry[]> {
    return this.http.get<AuditTimelineEntry[]>(`${this.apiUrl}/timeline`, { params: { scope, id: String(id) } });
  }

  timelinePdf(scope: AuditScope, id: number | string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/timeline/pdf`, { params: { scope, id: String(id) }, responseType: 'blob' });
  }

  searchAccess(filters: AuditSearchFilters, page = 0, size = 25): Observable<AuditPage<AuditAccessRow>> {
    return this.http.get<AuditPage<AuditAccessRow>>(`${this.apiUrl}/access`, { params: this.params(filters, page, size) });
  }

  searchRevisions(filters: AuditSearchFilters, page = 0, size = 25): Observable<AuditPage<AuditRevisionRow>> {
    return this.http.get<AuditPage<AuditRevisionRow>>(`${this.apiUrl}/revisions`, { params: this.params(filters, page, size) });
  }

  alerts(days = 7): Observable<AuditAlerts> {
    return this.http.get<AuditAlerts>(`${this.apiUrl}/alerts`, { params: { days: String(days) } });
  }

  verifyIntegrity(): Observable<AuditIntegrityReport> {
    return this.http.get<AuditIntegrityReport>(`${this.apiUrl}/integrity`);
  }

  sealNow(): Observable<{ sealed: number }> {
    return this.http.post<{ sealed: number }>(`${this.apiUrl}/seal`, {});
  }

  /** Télécharge un Blob sous le nom donné. */
  static download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private params(filters: AuditSearchFilters, page: number, size: number): HttpParams {
    let params = new HttpParams().set('page', page).set('size', size);
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        params = params.set(key, String(value).trim());
      }
    });
    return params;
  }
}
