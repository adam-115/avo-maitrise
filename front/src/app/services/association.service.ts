import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Association } from '../appTypes';
import { AbstractCrudService } from './genericService/abstract-crud.service';

@Injectable({
    providedIn: 'root'
})
export class AssociationService extends AbstractCrudService<Association> {
    protected override apiUrl = environment.apiUrl + 'clients/association';

    constructor(http: HttpClient) {
        super(http);
    }
}
