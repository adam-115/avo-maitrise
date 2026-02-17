
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractCrudService } from './genericService/abstract-crud.service';
import { environment } from '../../environments/environment';
import { DossierPriorite } from '../appTypes';

@Injectable({
    providedIn: 'root'
})
export class DossierPrioriteService extends AbstractCrudService<DossierPriorite> {
    protected override apiUrl = environment.apiUrl + 'DossierPriorite';

    constructor(http: HttpClient) {
        super(http);
    }
}
