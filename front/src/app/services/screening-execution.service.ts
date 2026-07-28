import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AbstractCrudService, PaginatedResponse } from './genericService/abstract-crud.service';
import { environment } from '../../environments/environment';
import { ScreeningExecutionDTO } from '../appTypes';

@Injectable({
    providedIn: 'root'
})
export class ScreeningExecutionService extends AbstractCrudService<ScreeningExecutionDTO> {
    protected override apiUrl = environment.apiUrl + 'screening/matches/execution';

    constructor(http: HttpClient) {
        super(http);
    }

    getByClientId(clientId: string | number, page: number = 0, size: number = 10, sort: string = 'createdAt,desc'): Observable<PaginatedResponse<ScreeningExecutionDTO>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString())
            .append('sort', sort)
            .append('sort', 'id,desc');
        return this.http.get<PaginatedResponse<ScreeningExecutionDTO>>(`${this.apiUrl}/by-client/${clientId}`, { params });
    }

    triggerClient(clientId: string | number): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/trigger-client/${clientId}`, {});
    }
}
