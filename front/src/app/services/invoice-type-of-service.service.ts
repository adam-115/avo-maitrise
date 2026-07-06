import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractCrudService } from './genericService/abstract-crud.service';
import { environment } from '../../environments/environment';
import { InvoiceTypeOfService } from '../appTypes';

@Injectable({
    providedIn: 'root'
})
export class InvoiceTypeOfServiceService extends AbstractCrudService<InvoiceTypeOfService> {
    protected override apiUrl = environment.apiUrl + 'InvoiceTypeOfService';

    constructor(http: HttpClient) {
        super(http);
    }
}
