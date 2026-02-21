import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractCrudService } from './genericService/abstract-crud.service';
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
}
