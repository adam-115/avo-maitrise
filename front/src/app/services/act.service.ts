import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ActTemplate {
  id?: number;
  code?: string;
  titre: string;
  categorie: string;
  pays: string;
  description?: string;
  format: 'TEXT_TEMPLATE' | 'DOCX_FILE';
  content?: string;
  minioObjectId?: string;
  nomFichier?: string;
  fileData?: string;
  active?: boolean;
}

export interface ActCabinetHeader {
  name?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  siret?: string;
  vatNumber?: string;
  iban?: string;
  logoDataUrl?: string;
}

export interface ActPreviewResponse {
  templateId: number;
  titre: string;
  format: 'TEXT_TEMPLATE' | 'DOCX_FILE';
  placeholders: string[];
  variables: Record<string, string>;
  missingVariables: string[];
  previewText: string;
  cabinet?: ActCabinetHeader;
}

@Injectable({ providedIn: 'root' })
export class ActService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}acts`;

  listTemplates(pays?: string, categorie?: string): Observable<ActTemplate[]> {
    const params: string[] = [];
    if (pays) params.push(`pays=${encodeURIComponent(pays)}`);
    if (categorie) params.push(`categorie=${encodeURIComponent(categorie)}`);
    const query = params.length ? `?${params.join('&')}` : '';
    return this.http.get<ActTemplate[]>(`${this.apiUrl}/templates${query}`);
  }

  saveTemplate(payload: ActTemplate): Observable<ActTemplate> {
    return this.http.post<ActTemplate>(`${this.apiUrl}/templates`, payload);
  }

  deleteTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/templates/${id}`);
  }

  getVariables(dossierId: number | string): Observable<Record<string, string>> {
    return this.http.get<Record<string, string>>(`${this.apiUrl}/variables/${dossierId}`);
  }

  preview(templateId: number, dossierId: number | string, values: Record<string, string>): Observable<ActPreviewResponse> {
    return this.http.post<ActPreviewResponse>(`${this.apiUrl}/preview`, {
      templateId,
      dossierId: Number(dossierId),
      values
    });
  }

  generateDocx(payload: {
    templateId: number;
    dossierId: number;
    customTitle: string;
    editedContent?: string;
    values: Record<string, string>;
    saveToDossier: boolean;
  }): Observable<HttpResponse<Blob>> {
    return this.http.post(`${this.apiUrl}/generate`, payload, {
      responseType: 'blob',
      observe: 'response'
    });
  }

  enhanceWithAi(dossierId: number | string, draftText: string, instruction: string): Observable<{ result: string }> {
    return this.http.post<{ result: string }>(`${this.apiUrl}/enhance-with-ai`, {
      dossierId: Number(dossierId),
      draftText,
      instruction
    });
  }
}
