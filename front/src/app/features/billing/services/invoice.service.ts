import { computed, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { InvoiceEntity, InvoiceStatusEnum } from '../../../appTypes';
import { AbstractCrudService, PaginatedResponse } from '../../../services/genericService/abstract-crud.service';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class InvoiceService extends AbstractCrudService<InvoiceEntity> {
    protected override apiUrl = environment.apiUrl + 'invoice';

   
}
