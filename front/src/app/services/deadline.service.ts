import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DeadlineRule {
  id: number;
  code: string;
  pays: string;
  domaineCode: string;
  categorie: string;
  libelle: string;
  description?: string;
  dureeValeur: number;
  dureeUnite: 'DAYS' | 'MONTHS' | 'YEARS';
  computationMode: string;
  prorogeWeekendFerie: boolean;
  estFranc: boolean;
  criticiteDefaut: string;
  baseLegale?: string;
  sourceUrl?: string;
  active: boolean;
}

export interface DossierDeadline {
  id?: number;
  dossierId: number;
  dossierReference?: string;
  dossierTitre?: string;
  ruleId?: number | null;
  pays: string;
  titre?: string;
  categorie?: string;
  triggerEventLabel?: string;
  dateDepart: string; // YYYY-MM-DD
  dateEcheanceCalculee?: string;
  dateEcheanceFinale?: string;
  detailCalcul?: string;
  baseLegale?: string;
  sourceUrl?: string;
  delaiDistanceMois: number;
  alsaceMoselle: boolean;
  suspensionJours: number;
  statut?: string;
  criticite?: string;
  responsableId?: string;
  suppleantId?: string;
  validePar?: string;
  valideLe?: string;
  accompliPar?: string;
  accompliLe?: string;
  justificatifAccomplissement?: string;
  motifModification?: string;
  matterEventId?: number;
  documentId?: number;
  externalCalendarEventId?: string;
  externalCalendarProvider?: string;
  joursRestants?: number;
  enRetard?: boolean;
  customDureeValeur?: number;
  customDureeUnite?: string;
  customProrogeWeekendFerie?: boolean;
  customEstFranc?: boolean;
  syncAgenda?: boolean;
  etapesCalcul?: string[];
}

@Injectable({ providedIn: 'root' })
export class DeadlineService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}deadlines`;

  getRules(pays?: string): Observable<DeadlineRule[]> {
    const query = pays ? `?pays=${encodeURIComponent(pays)}` : '';
    return this.http.get<DeadlineRule[]>(`${this.apiUrl}/rules${query}`);
  }

  saveRule(rule: Partial<DeadlineRule>): Observable<DeadlineRule> {
    return this.http.post<DeadlineRule>(`${this.apiUrl}/rules`, rule);
  }

  deleteRule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/rules/${id}`);
  }

  findByDossier(dossierId: number | string): Observable<DossierDeadline[]> {
    return this.http.get<DossierDeadline[]>(`${this.apiUrl}/dossier/${dossierId}`);
  }

  findUpcoming(days = 30): Observable<DossierDeadline[]> {
    return this.http.get<DossierDeadline[]>(`${this.apiUrl}/upcoming?days=${days}`);
  }

  preview(payload: DossierDeadline): Observable<DossierDeadline> {
    return this.http.post<DossierDeadline>(`${this.apiUrl}/preview`, payload);
  }

  create(payload: DossierDeadline): Observable<DossierDeadline> {
    return this.http.post<DossierDeadline>(this.apiUrl, payload);
  }

  complete(id: number, justificatif: string): Observable<DossierDeadline> {
    return this.http.post<DossierDeadline>(`${this.apiUrl}/${id}/complete`, { justificatif });
  }

  interrupt(id: number, dateInterruption: string, motif: string, relancer: boolean): Observable<DossierDeadline> {
    return this.http.post<DossierDeadline>(`${this.apiUrl}/${id}/interrupt`, {
      dateInterruption,
      motif,
      relancer
    });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  detectFromDocument(dossierId: number | string, documentId: number): Observable<DossierDeadline[]> {
    return this.http.post<DossierDeadline[]>(
      `${this.apiUrl}/dossier/${dossierId}/detect-from-document/${documentId}`,
      {}
    );
  }
}
