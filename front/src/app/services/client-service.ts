import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Client, ClientStatus } from '../appTypes';
import { AbstractCrudService, PaginatedResponse } from './genericService/abstract-crud.service';

@Injectable({
    providedIn: 'root'
})
export class ClientService extends AbstractCrudService<Client> {
    protected override apiUrl = environment.apiUrl + 'clients';

    constructor(http: HttpClient) {
        super(http);
    }

    override findAll(page: number = 0, size: number = 10, sort?: string, filters?: any): Observable<PaginatedResponse<Client>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (sort) {
            params = params.set('sort', sort);
        }

        if (filters) {
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
                    params = params.set(key, filters[key]);
                }
            });
        }

        return this.http.get<PaginatedResponse<Client>>(this.apiUrl, { params });
    }

    updateClientStatus(id: string | number, status: ClientStatus): Observable<Client> {
        return this.http.patch<Client>(`${this.apiUrl}/${id}`, { clientStatus: status });
    }
}
