import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ConflictPartyInput {
  clientId?: number | null;
  role?: string;
  name?: string;
}

export interface ConflictCheckRequest {
  dossierId?: number | null;
  clientId?: number | null;
  parties?: ConflictPartyInput[];
  freeTextQueries?: string[];
}

export interface ConflictMatch {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  matchType: 'CLIENT_DIRECT' | 'IDENTIFIANT_UNIQUE' | 'DIRIGEANT' | 'UBO' | 'PARTIE_DOSSIER' | 'HOMONYME';
  queriedEntity: string;
  matchedEntityName: string;
  matchedClientId?: number | null;
  matchedDossierId?: number | null;
  matchedDossierReference?: string | null;
  matchedDossierTitre?: string | null;
  matchedRole?: string | null;
  explanation: string;
  matchedClientDeleted?: boolean;
}

export interface ConflictCheckResponse {
  hasConflict: boolean;
  riskLevel: 'NONE' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiresJustification: boolean;
  searchSummary: string;
  matches: ConflictMatch[];
}

export interface ConflictRecordRequest {
  dossierId?: number | null;
  searchSummary?: string;
  riskLevel: string;
  decision: 'CLEARED' | 'PROCEEDED_WITH_WAIVER' | 'BLOCKED' | 'SEARCH_ONLY';
  justification?: string | null;
  matches: ConflictMatch[];
}

export interface ConflictCheckHistoryItem {
  id: number;
  dossierId?: number | null;
  checkedBy: string;
  checkedAt: string;
  searchSummary?: string;
  riskLevel: 'NONE' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  matchesCount: number;
  decision: 'CLEARED' | 'PROCEEDED_WITH_WAIVER' | 'BLOCKED' | 'SEARCH_ONLY';
  justification?: string | null;
  matches: ConflictMatch[];
}

@Injectable({ providedIn: 'root' })
export class ConflictCheckService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}conflicts`;

  check(request: ConflictCheckRequest): Observable<ConflictCheckResponse> {
    return this.http.post<ConflictCheckResponse>(`${this.baseUrl}/check`, request);
  }

  record(request: ConflictRecordRequest): Observable<ConflictCheckHistoryItem> {
    return this.http.post<ConflictCheckHistoryItem>(`${this.baseUrl}/record`, request);
  }

  getDossierHistory(dossierId: number | string): Observable<ConflictCheckHistoryItem[]> {
    return this.http.get<ConflictCheckHistoryItem[]>(`${this.baseUrl}/dossier/${dossierId}`);
  }

  recheckDossier(dossierId: number | string): Observable<ConflictCheckResponse> {
    return this.http.post<ConflictCheckResponse>(`${this.baseUrl}/dossier/${dossierId}/recheck`, {});
  }
}
