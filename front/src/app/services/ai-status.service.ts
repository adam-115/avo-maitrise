import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AiStatusService {
  private apiUrl = `${environment.apiUrl}ai-configuration/status`;
  
  private aiEnabledSubject = new BehaviorSubject<boolean>(false);
  public isAiEnabled$ = this.aiEnabledSubject.asObservable();

  constructor(private http: HttpClient) {}

  public checkAiStatus(): void {
    this.http.get<boolean>(this.apiUrl).pipe(
      tap(status => this.aiEnabledSubject.next(status)),
      catchError(error => {
        console.error('Erreur lors de la vérification du statut IA', error);
        this.aiEnabledSubject.next(false);
        return [];
      })
    ).subscribe();
  }

  public get isAiEnabled(): boolean {
    return this.aiEnabledSubject.value;
  }
}
