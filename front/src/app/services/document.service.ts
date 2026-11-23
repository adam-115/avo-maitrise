import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AbstractCrudService, PaginatedResponse } from './genericService/abstract-crud.service';
import { environment } from '../../environments/environment';
import { Document } from '../appTypes';

@Injectable({
    providedIn: 'root'
})
export class DocumentService extends AbstractCrudService<Document> {
    protected override apiUrl = environment.apiUrl + 'documents';

    constructor(http: HttpClient) {
        super(http);
    }

    getByDossierId(dossierId: string | number, page: number = 0, size: number = 10): Observable<PaginatedResponse<Document>> {
        const params = new HttpParams()
            .set('dossier.id', dossierId.toString())
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<PaginatedResponse<Document>>(`${this.apiUrl}/search`, { params });
    }

    getByType(typeDocument: string, page: number = 0, size: number = 100): Observable<PaginatedResponse<Document>> {
        const params = new HttpParams()
            .set('typeDocument', typeDocument)
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<PaginatedResponse<Document>>(`${this.apiUrl}/search`, { params });
    }

    /**
     * Base légale d'un pays : décisions (JURISPRUDENCE) ou textes de loi (LEGISLATION). Les deux sont consultés
     * par l'IA pour le droit applicable d'un dossier.
     */
    getJurisprudence(pays: string, page: number = 0, size: number = 100,
                     typeDocument: 'JURISPRUDENCE' | 'LEGISLATION' = 'JURISPRUDENCE'): Observable<PaginatedResponse<Document>> {
        const params = new HttpParams()
            .set('typeDocument', typeDocument)
            .set('pays', pays)
            .set('page', page.toString())
            .set('size', size.toString());
        return this.http.get<PaginatedResponse<Document>>(`${this.apiUrl}/search`, { params });
    }

    downloadDocumentFile(id: number | string): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/${id}/download`, { responseType: 'blob' });
    }
}
