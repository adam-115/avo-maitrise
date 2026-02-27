import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractCrudService } from './genericService/abstract-crud.service';
import { environment } from '../../environments/environment';
import { NoteCategory } from '../appTypes';

@Injectable({
    providedIn: 'root'
})
export class NoteCategoryService extends AbstractCrudService<NoteCategory> {
    protected override apiUrl = environment.apiUrl + 'NoteCategory';

    constructor(http: HttpClient) {
        super(http);
    }
}
