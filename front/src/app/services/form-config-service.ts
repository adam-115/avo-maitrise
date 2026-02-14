import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { FormConfig } from '../appTypes';
import { AbstractCrudService } from './genericService/abstract-crud.service';

@Injectable({
    providedIn: 'root'
})
export class FormConfigService extends AbstractCrudService<FormConfig> {
    protected override apiUrl = environment.apiUrl + 'formConfig';

    constructor(http: HttpClient) {
        super(http);
    }
}
