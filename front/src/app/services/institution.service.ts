import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Institution } from '../appTypes';
import { AbstractCrudService } from './genericService/abstract-crud.service';

@Injectable({
    providedIn: 'root'
})
export class InstitutionService extends AbstractCrudService<Institution> {
    protected override apiUrl = environment.apiUrl + 'clients/institution';

    constructor(http: HttpClient) {
        super(http);
    }
}
