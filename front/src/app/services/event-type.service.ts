import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractCrudService } from './genericService/abstract-crud.service';
import { environment } from '../../environments/environment';
import { EventType } from '../appTypes';

@Injectable({
    providedIn: 'root'
})
export class EventTypeService extends AbstractCrudService<EventType> {
    protected override apiUrl = environment.apiUrl + 'EventType';

    constructor(http: HttpClient) {
        super(http);
    }
}
