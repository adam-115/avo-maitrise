import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AbstractCrudService } from './genericService/abstract-crud.service';
import { environment } from '../../environments/environment';
import { UBO } from '../appTypes';

@Injectable({
    providedIn: 'root'
})
export class UBOService extends AbstractCrudService<UBO> {
    protected override apiUrl = environment.apiUrl + 'ubos';

    constructor(http: HttpClient) {
        super(http);
    }

    generateUboAmlReportPdf(startDate?: string, endDate?: string): Observable<Blob> {
        let params = new HttpParams();
        if (startDate) {
            params = params.set('startDate', startDate);
        }
        if (endDate) {
            params = params.set('endDate', endDate);
        }
        return this.http.get(`${this.apiUrl}/aml-report/pdf`, { params, responseType: 'blob' });
    }
}
