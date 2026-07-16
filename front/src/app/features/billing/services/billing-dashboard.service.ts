import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ActiveClientsCount {
    count: number;
}

export interface ActiveDossiersCount {
    count: number;
}

export interface UnbilledMinutes {
    count: number;
}

export interface UnbilledAmounts {
    ht: number;
    ttc: number;
}

export interface UnbilledDossierSummary {
    dossierId: number;
    dossierTitre: string;
    referenceInterne: string;
    clientId: number;
    clientName: string;
    unbilledMinutes: number;
    unbilledAmountHT: number;
}

@Injectable({
    providedIn: 'root'
})
export class BillingDashboardService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = environment.apiUrl + 'dashboard/billing';

    getActiveClientsCount(): Observable<ActiveClientsCount> {
        return this.http.get<ActiveClientsCount>(`${this.apiUrl}/active-clients-count`);
    }

    getActiveDossiersCount(): Observable<ActiveDossiersCount> {
        return this.http.get<ActiveDossiersCount>(`${this.apiUrl}/active-dossiers-count`);
    }

    getUnbilledMinutes(startDate?: string, endDate?: string): Observable<{count: number}> {
        let params = new HttpParams();
        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);
        return this.http.get<{count: number}>(`${this.apiUrl}/unbilled-minutes`, { params });
    }

    getBilledMinutes(startDate?: string, endDate?: string): Observable<{count: number}> {
        let params = new HttpParams();
        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);
        return this.http.get<{count: number}>(`${this.apiUrl}/billed-minutes`, { params });
    }

    getUnbilledAmounts(startDate?: string, endDate?: string): Observable<{ht: number, ttc: number}> {
        let params = new HttpParams();
        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);
        return this.http.get<{ht: number, ttc: number}>(`${this.apiUrl}/unbilled-amounts`, { params });
    }

    getBilledAmounts(startDate?: string, endDate?: string): Observable<{ht: number, ttc: number}> {
        let params = new HttpParams();
        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);
        return this.http.get<{ht: number, ttc: number}>(`${this.apiUrl}/billed-amounts`, { params });
    }

    getPendingMinutes(startDate?: string, endDate?: string): Observable<{count: number}> {
        let params = new HttpParams();
        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);
        return this.http.get<{count: number}>(`${this.apiUrl}/pending-minutes`, { params });
    }

    getPendingAmounts(startDate?: string, endDate?: string): Observable<{ht: number, ttc: number}> {
        let params = new HttpParams();
        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);
        return this.http.get<{ht: number, ttc: number}>(`${this.apiUrl}/pending-amounts`, { params });
    }

    getCancelledMinutes(startDate?: string, endDate?: string): Observable<{count: number}> {
        let params = new HttpParams();
        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);
        return this.http.get<{count: number}>(`${this.apiUrl}/cancelled-minutes`, { params });
    }

    getCancelledAmounts(startDate?: string, endDate?: string): Observable<{ht: number, ttc: number}> {
        let params = new HttpParams();
        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);
        return this.http.get<{ht: number, ttc: number}>(`${this.apiUrl}/cancelled-amounts`, { params });
    }

    getUnbilledByDossier(startDate?: string, endDate?: string): Observable<UnbilledDossierSummary[]> {
        let params = new HttpParams();
        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);
        return this.http.get<UnbilledDossierSummary[]>(`${this.apiUrl}/unbilled-by-dossier`, { params });
    }
}
