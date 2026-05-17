import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AbstractCrudService, PaginatedResponse } from './genericService/abstract-crud.service';
import { environment } from '../../environments/environment';
import { Task } from '../appTypes';

@Injectable({
    providedIn: 'root'
})
export class TaskService extends AbstractCrudService<Task> {
    protected override apiUrl = environment.apiUrl + 'Task';

    constructor(http: HttpClient) {
        super(http);
    }

    getByDossierId(
        dossierId: string | number,
        page: number = 0,
        size: number = 10,
        categoryId?: string,
        statusId?: string,
        priorite?: string,
        search?: string
    ): Observable<PaginatedResponse<Task>> {
        let params = new HttpParams()
            .set('dossierId', dossierId.toString())
            .set('page', page.toString())
            .set('size', size.toString());
        
        if (categoryId) {
            params = params.set('category.id', categoryId);
        }
        if (statusId) {
            params = params.set('status.id', statusId);
        }
        if (priorite) {
            params = params.set('priorite', priorite);
        }
        if (search) {
            params = params.set('titre', search); // Search by title/titre in Querydsl
        }

        return this.http.get<PaginatedResponse<Task>>(`${this.apiUrl}/search`, { params });
    }
}
