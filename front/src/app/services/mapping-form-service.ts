import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { MappingForm } from '../appTypes';
import { AbstractCrudService } from './genericService/abstract-crud.service';

@Injectable({
    providedIn: 'root',
})
export class MappingFormService extends AbstractCrudService<MappingForm> {
    protected apiUrl = environment.apiUrl + 'MappingForm';

    constructor(http: HttpClient) {
        super(http);
    }
}
