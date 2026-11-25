import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WordExportService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}export/word`;

  downloadStrategy(dossierId: string | number, fallbackFilename = 'Strategie_Avocat_IA.docx'): Observable<HttpResponse<Blob>> {
    return this.download(`${this.baseUrl}/dossier/${dossierId}/strategie`, fallbackFilename);
  }

  downloadChat(dossierId: string | number, fallbackFilename = 'Discussion_Avocat_IA.docx'): Observable<HttpResponse<Blob>> {
    return this.download(`${this.baseUrl}/dossier/${dossierId}/chat`, fallbackFilename);
  }

  downloadNote(noteId: string | number, fallbackFilename = 'Note_Dossier.docx'): Observable<HttpResponse<Blob>> {
    return this.download(`${this.baseUrl}/note/${noteId}`, fallbackFilename);
  }

  private download(url: string, fallbackFilename: string): Observable<HttpResponse<Blob>> {
    return this.http.get(url, { responseType: 'blob', observe: 'response' }).pipe(
      tap(resp => {
        const blob = resp.body;
        if (!blob) return;
        const disposition = resp.headers.get('Content-Disposition') || '';
        const match = disposition.match(/filename="?([^"]+)"?/i);
        const filename = match?.[1] || fallbackFilename;

        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      })
    );
  }
}
