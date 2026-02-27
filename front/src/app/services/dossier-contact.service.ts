import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractCrudService } from './genericService/abstract-crud.service';
import { environment } from '../../environments/environment';
import { DossierContact } from '../appTypes';

@Injectable({
    providedIn: 'root'
})
export class DossierContactService extends AbstractCrudService<DossierContact> {
    protected override apiUrl = environment.apiUrl + 'DossierContact';

    constructor(http: HttpClient) {
        super(http);
    }
}
