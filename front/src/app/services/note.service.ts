import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AbstractCrudService, PaginatedResponse } from './genericService/abstract-crud.service';
import { environment } from '../../environments/environment';
import { Note } from '../appTypes';

@Injectable({
    providedIn: 'root'
})
export class NoteService extends AbstractCrudService<Note> {
    protected override apiUrl = environment.apiUrl + 'Note';

    constructor(http: HttpClient) {
        super(http);
    }

    getByDossierId(
        dossierId: string | number,
        page: number = 0,
        size: number = 10
    ): Observable<PaginatedResponse<Note>> {
        const params = new HttpParams()
            .set('dossier.id', dossierId.toString())
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<PaginatedResponse<Note>>(`${this.apiUrl}/search`, { params });
    }
}
