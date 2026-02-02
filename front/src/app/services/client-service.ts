
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { ClientDetail } from '../appTypes';
import { AbstractCrudService } from './genericService/abstract-crud.service';

@Injectable({
    providedIn: 'root'
})
export class ClientService extends AbstractCrudService<ClientDetail> {

    protected apiUrl = environment.apiUrl + 'clients';

    constructor(http: HttpClient) {
        super(http);
    }
}
