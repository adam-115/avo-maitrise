import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AbstractCrudService, PaginatedResponse } from './genericService/abstract-crud.service';
import { environment } from '../../environments/environment';
import { ScreeningMatchDTO } from '../appTypes';

@Injectable({
    providedIn: 'root'
})
export class ScreeningMatchService extends AbstractCrudService<ScreeningMatchDTO> {
    protected override apiUrl = environment.apiUrl + 'screening/matches';

    constructor(http: HttpClient) {
        super(http);
    }

    getByClientId(clientId: string | number, page: number = 0, size: number = 10, sort: string = 'createdAt,desc'): Observable<PaginatedResponse<ScreeningMatchDTO>> {
        const params = new HttpParams()
            .set('client.id', clientId.toString())
            .set('page', page.toString())
            .set('size', size.toString())
            .append('sort', sort)
            .append('sort', 'id,desc');
        return this.http.get<PaginatedResponse<ScreeningMatchDTO>>(`${this.apiUrl}/search`, { params });
    }

    processDecision(matchId: number, decision: string, comment: string, reviewer: string): Observable<ScreeningMatchDTO> {
        let params = new HttpParams()
            .set('decision', decision)
            .set('comment', comment)
            .set('reviewer', reviewer);
        return this.http.post<ScreeningMatchDTO>(`${this.apiUrl}/${matchId}/process-decision`, null, { params });
    }

    getReEvaluationMatches(page: number = 0, size: number = 5): Observable<PaginatedResponse<ScreeningMatchDTO>> {
        const params = new HttpParams()
            .set('status', 'RE_EVALUATION_REQUIRED')
            .set('page', page.toString())
            .set('size', size.toString())
            .set('sort', 'createdAt,desc');
        return this.http.get<PaginatedResponse<ScreeningMatchDTO>>(`${this.apiUrl}/search`, { params });
    }
}
