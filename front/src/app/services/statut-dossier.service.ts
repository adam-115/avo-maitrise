import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractCrudService } from './genericService/abstract-crud.service';
import { environment } from '../../environments/environment';
import { StatutDossier } from '../appTypes';

@Injectable({
    providedIn: 'root'
})
export class MatterStatusService extends AbstractCrudService<StatutDossier> {
    protected override apiUrl = environment.apiUrl + 'StatutDossier';

    constructor(http: HttpClient) {
        super(http);
    }
}
