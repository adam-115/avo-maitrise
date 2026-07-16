import { computed, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { InvoiceEntity, InvoiceStatusEnum } from '../../../appTypes';
import { AbstractCrudService, PaginatedResponse } from '../../../services/genericService/abstract-crud.service';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class InvoiceService extends AbstractCrudService<InvoiceEntity> {
    protected override apiUrl = environment.apiUrl + 'invoice';

    downloadInvoicePdf(id: string | number) {
        return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
    }

    downloadBulkInvoicePdf(ids: (string | number)[]) {
        const params = new HttpParams().set('ids', ids.join(','));
        return this.http.get(`${this.apiUrl}/bulk-pdf`, { params, responseType: 'blob' });
    }

    search(filters: any, page: number = 0, size: number = 10, sort?: string) {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (sort) {
            params = params.set('sort', sort);
        }

        if (filters) {
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
                    if (Array.isArray(filters[key])) {
                        filters[key].forEach((val: any) => {
                            if (val !== null && val !== '') {
                                params = params.append(key, val);
                            }
                        });
                    } else {
                        params = params.set(key, filters[key]);
                    }
                }
            });
        }

        return this.http.get<PaginatedResponse<InvoiceEntity>>(`${this.apiUrl}/search`, { params });
    }
}
