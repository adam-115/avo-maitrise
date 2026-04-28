import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { ClientMoral } from '../appTypes';
import { AbstractCrudService } from './genericService/abstract-crud.service';

@Injectable({
    providedIn: 'root'
})
export class ClientMoralService extends AbstractCrudService<ClientMoral> {
    protected override apiUrl = environment.apiUrl + 'clients/moral';

    constructor(http: HttpClient) {
        super(http);
    }
}
