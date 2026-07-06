import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractCrudService } from './genericService/abstract-crud.service';
import { environment } from '../../environments/environment';
import { InvoiceDossierServieStatus } from '../appTypes';

@Injectable({
    providedIn: 'root'
})
export class InvoiceDossierServieStatusService extends AbstractCrudService<InvoiceDossierServieStatus> {
    protected override apiUrl = environment.apiUrl + 'InvoiceDossierServieStatus';

    constructor(http: HttpClient) {
        super(http);
    }
}
