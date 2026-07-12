import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CabinetProfile } from '../appTypes';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CabinetProfileService {
  private apiUrl = environment.apiUrl + 'cabinet-profile';
  private http = inject(HttpClient);

  getProfile(): Observable<CabinetProfile> {
    return this.http.get<CabinetProfile>(this.apiUrl);
  }

  updateProfile(profile: CabinetProfile): Observable<CabinetProfile> {
    return this.http.put<CabinetProfile>(this.apiUrl, profile);
  }
}
