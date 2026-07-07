import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractCrudService } from './genericService/abstract-crud.service';
import { environment } from '../../environments/environment';
import { InvoiceDossierService } from '../appTypes';

@Injectable({
    providedIn: 'root'
})
export class InvoiceDossierServiceService extends AbstractCrudService<InvoiceDossierService> {
    protected override apiUrl = environment.apiUrl + 'InvoiceDossierService';

    constructor(http: HttpClient) {
        super(http);
    }
}
