import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Client } from '../appTypes';
import { AbstractCrudService } from './genericService/abstract-crud.service';

@Injectable({
    providedIn: 'root'
})
export class ClientService extends AbstractCrudService<Client> {
    protected override apiUrl = environment.apiUrl + 'clients';

    constructor(http: HttpClient) {
        super(http);
    }
}
