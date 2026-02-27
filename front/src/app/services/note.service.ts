import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractCrudService } from './genericService/abstract-crud.service';
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
}
