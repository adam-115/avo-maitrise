import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractCrudService } from './genericService/abstract-crud.service';
import { environment } from '../../environments/environment';
import { MatterEvent } from '../appTypes';

@Injectable({
    providedIn: 'root'
})
export class MatterEventService extends AbstractCrudService<MatterEvent> {
    protected override apiUrl = environment.apiUrl + 'MatterEvent';

    constructor(http: HttpClient) {
        super(http);
    }
}
