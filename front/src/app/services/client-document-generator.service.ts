import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ModelCandidate {
  id: number;
  title: string;
  nomFichier: string;
  description: string;
  tags: string;
  reason: string;
  recommended: boolean;
}

export interface ModelSearchResult {
  aiUsed: boolean;
  totalModelsInLibrary: number;
  assistantMessage: string;
  matches: ModelCandidate[];
  allModels: ModelCandidate[];
}

@Injectable({
  providedIn: 'root'
})
export class ClientDocumentGeneratorService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}client-documents`;

  searchModels(clientId: number | string | null | undefined, prompt: string, dossierId?: number | string | null): Observable<ModelSearchResult> {
    return this.http.post<ModelSearchResult>(`${this.baseUrl}/search-models`, {
      clientId: clientId ? Number(clientId) : null,
      dossierId: dossierId ? Number(dossierId) : null,
      prompt
    });
  }

  generateDocument(payload: {
    clientId?: number | string | null;
    dossierId?: number | string | null;
    modelDocumentId: number;
    instructions?: string;
    saveToClientGed: boolean;
  }): Observable<HttpResponse<Blob>> {
    return this.http.post(`${this.baseUrl}/generate`, {
      clientId: payload.clientId ? Number(payload.clientId) : null,
      dossierId: payload.dossierId ? Number(payload.dossierId) : null,
      modelDocumentId: payload.modelDocumentId,
      instructions: payload.instructions || '',
      saveToClientGed: payload.saveToClientGed
    }, {
      observe: 'response',
      responseType: 'blob'
    });
  }
}
