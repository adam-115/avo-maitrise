import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MailIntegrationStatusService {
  private http = inject(HttpClient);
  private statusUrl = `${environment.apiUrl}mail-integration/status`;

  private enabledSubject = new BehaviorSubject<boolean>(false);
  public isEnabled$ = this.enabledSubject.asObservable();

  public checkStatus(): void {
    this.http.get<{ enabled: boolean }>(this.statusUrl).pipe(
      map(res => !!res?.enabled),
      tap(enabled => this.enabledSubject.next(enabled)),
      catchError(() => {
        this.enabledSubject.next(false);
        return of(false);
      })
    ).subscribe();
  }

  public setEnabled(enabled: boolean): Observable<boolean> {
    return this.http.put<{ enabled: boolean }>(`${this.statusUrl}?enabled=${enabled}`, {}).pipe(
      map(res => !!res?.enabled),
      tap(val => this.enabledSubject.next(val))
    );
  }

  public get isEnabled(): boolean {
    return this.enabledSubject.value;
  }
}
