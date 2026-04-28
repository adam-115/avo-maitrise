import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractCrudService } from './genericService/abstract-crud.service';
import { environment } from '../../environments/environment';
import { UBO } from '../appTypes';

@Injectable({
    providedIn: 'root'
})
export class UBOService extends AbstractCrudService<UBO> {
    protected override apiUrl = environment.apiUrl + 'ubos';

    constructor(http: HttpClient) {
        super(http);
    }
}
