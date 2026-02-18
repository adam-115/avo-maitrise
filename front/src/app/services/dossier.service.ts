import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractCrudService } from './genericService/abstract-crud.service';
import { environment } from '../../environments/environment';
import { Dossier } from '../appTypes';

@Injectable({
    providedIn: 'root'
})
export class DossierService extends AbstractCrudService<Dossier> {
    protected override apiUrl = environment.apiUrl + 'dossiers';

    constructor(http: HttpClient) {
        super(http);
    }
}
