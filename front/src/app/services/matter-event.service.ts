import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AbstractCrudService, PaginatedResponse } from './genericService/abstract-crud.service';
import { environment } from '../../environments/environment';
import { MatterEvent } from '../appTypes';

@Injectable({
    providedIn: 'root'
})
export class MatterEventService extends AbstractCrudService<MatterEvent> {
    protected override apiUrl = environment.apiUrl + 'MatterEvent';

    constructor(http: HttpClient) {
        super(http);
    }

    getByDossierId(dossierId: string | number, page: number = 0, size: number = 10): Observable<PaginatedResponse<MatterEvent>> {
        const params = new HttpParams()
            .set('dossierId', dossierId.toString())
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<PaginatedResponse<MatterEvent>>(`${this.apiUrl}/search`, { params });
    }
}
