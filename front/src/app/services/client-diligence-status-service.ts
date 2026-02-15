import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AbstractCrudService } from './genericService/abstract-crud.service';
import { ClientDiligenceStatus } from '../appTypes';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ClientDiligenceStatusService extends AbstractCrudService<ClientDiligenceStatus> {
    protected override apiUrl = environment.apiUrl + 'ClientDiligenceStatus';

    constructor(http: HttpClient) {
        super(http);
    }

    findByClientId(clientId: string): Observable<ClientDiligenceStatus[]> {
        return this.http.get<ClientDiligenceStatus[]>(`${this.apiUrl}?clientId=${clientId}`);
    }
}
