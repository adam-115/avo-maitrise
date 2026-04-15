import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { YenteMatchResponse } from '../appTypes';

@Injectable({
  providedIn: 'root'
})
export class AmlService {
  private readonly http = inject(HttpClient);

  /**
   * Appelle l'API Yente via le backend pour vérifier un nom
   * @param name Nom complet du client (ex: "Nom Prénom")
   */
  public verifyClient(name: string): Observable<string | YenteMatchResponse> {
    return this.http.get<string | YenteMatchResponse>(`/api/aml/screen?name=${encodeURIComponent(name)}`);
  }
}
