import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { InvoiceDossierService, InvoiceDossierServiceStatusEnum } from '../appTypes';

export interface PrestationProposal {
  sourceKey: string;
  sourceType: 'EMAIL' | 'NOTE' | 'TASK' | 'APPOINTMENT' | 'EVENT' | string;
  sourceLabel: string;
  serviceDate: string;
  info: string;
  invoiceTypeOfServiceId: number | null;
  invoiceTypeOfServiceLabel: string | null;
  nbrOfMinutes: number;
  estimatedAmountHT: number;
  confidence: 'HIGH' | 'MEDIUM' | string;
  reason: string;
}

export interface PrestationAuditResult {
  dossierId: number;
  aiUsed: boolean;
  emailsIncluded: boolean;
  summary: string;
  analyzedSources: string[];
  existingPrestationsCount: number;
  ignoredDecisionsCount: number;
  proposals: PrestationProposal[];
}

export interface AcceptPrestationProposalRequest {
  sourceKey: string;
  serviceDate: string;
  info: string;
  invoiceTypeOfServiceId: number | null;
  nbrOfMinutes: number;
  doneById?: number | null;
  status?: InvoiceDossierServiceStatusEnum;
}

@Injectable({
  providedIn: 'root'
})
export class PrestationAiAuditService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}prestations/ai-audit`;

  auditDossier(dossierId: string | number): Observable<PrestationAuditResult> {
    return this.http.post<PrestationAuditResult>(`${this.baseUrl}/dossier/${dossierId}`, {});
  }

  acceptProposal(dossierId: string | number, payload: AcceptPrestationProposalRequest): Observable<InvoiceDossierService> {
    return this.http.post<InvoiceDossierService>(`${this.baseUrl}/dossier/${dossierId}/accept`, payload);
  }

  rejectProposal(dossierId: string | number, sourceKey: string, suggestedInfo: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/dossier/${dossierId}/reject`, { sourceKey, suggestedInfo });
  }

  resetRejected(dossierId: string | number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/dossier/${dossierId}/decisions`);
  }
}
