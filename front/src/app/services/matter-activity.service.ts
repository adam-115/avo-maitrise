import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MatterActivity } from '../appTypes';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MatterActivityService {
  private apiUrl = `${environment.apiUrl}matter-activities`;

  constructor(private http: HttpClient) { }

  getActivitiesByDossier(dossierId: number | string): Observable<MatterActivity[]> {
    return this.http.get<MatterActivity[]>(`${this.apiUrl}/dossier/${dossierId}`);
  }

  searchActivities(
    dossierId: number | string,
    startDate?: string,
    endDate?: string,
    page: number = 0,
    size: number = 10
  ): Observable<any> {
    let params: any = { page, size };
    if (startDate) params.start = startDate;
    if (endDate) params.end = endDate;

    return this.http.get<any>(`${this.apiUrl}/dossier/${dossierId}/search`, { params });
  }
}
