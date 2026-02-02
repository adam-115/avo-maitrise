import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { TypeOrganisme } from '../appTypes';
import { AbstractCrudService } from './genericService/abstract-crud.service';

@Injectable({
    providedIn: 'root'
})
export class TypeOrganismeService extends AbstractCrudService<TypeOrganisme> {
    protected apiUrl = environment.apiUrl + 'TypeOrganisme';

    constructor(http: HttpClient) {
        super(http);
    }
}
