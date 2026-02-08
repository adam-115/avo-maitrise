import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AmlFormConfig, MappingForm } from '../appTypes';
import { AmlFormConfigService } from './AmlFormConfigService';
import { AbstractCrudService } from './genericService/abstract-crud.service';

@Injectable({
    providedIn: 'root',
})
export class MappingFormService extends AbstractCrudService<MappingForm> {
    protected apiUrl = environment.apiUrl + 'MappingForm';

    amlFormConfigService = inject(AmlFormConfigService);

    constructor(http: HttpClient) {
        super(http);
    }

    findMappingByClientTypeAndSector(typeClient: string, secteurActivite: string): Observable<AmlFormConfig[]> {
        return this.getAll().pipe(
            switchMap(mappings => {
                const matchingMappings = mappings.filter(m =>
                    m.typeClient === typeClient && m.secteurActivite === secteurActivite
                );

                if (matchingMappings.length === 0) {
                    return of([]);
                }

                const configRequests = matchingMappings.map(m =>
                    this.amlFormConfigService.findById(m.amlFormConfigID)
                );

                return forkJoin(configRequests);
            })
        );
    }

}
