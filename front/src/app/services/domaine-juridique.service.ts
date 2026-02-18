import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractCrudService } from './genericService/abstract-crud.service';
import { environment } from '../../environments/environment';
import { DomaineJuridique } from '../appTypes';

@Injectable({
    providedIn: 'root'
})
export class DomaineJuridiqueService extends AbstractCrudService<DomaineJuridique> {
    protected override apiUrl = environment.apiUrl + 'DomaineJuridique';

    constructor(http: HttpClient) {
        super(http);
    }
}
