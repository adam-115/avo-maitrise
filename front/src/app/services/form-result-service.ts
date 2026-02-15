import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DiligenceFormResult } from '../appTypes';
import { AbstractCrudService } from './genericService/abstract-crud.service';

@Injectable({
    providedIn: 'root'
})
export class FormResultService extends AbstractCrudService<DiligenceFormResult> {
    protected override apiUrl = environment.apiUrl + 'DiligenceFormResult';

    constructor(http: HttpClient) {
        super(http);
    }

    findByClientId(clientId: string): Observable<DiligenceFormResult[]> {
        return this.http.get<DiligenceFormResult[]>(`${this.apiUrl}?clientId=${clientId}`);
    }
}
