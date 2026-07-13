import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AbstractCrudService, PaginatedResponse } from './genericService/abstract-crud.service';
import { environment } from '../../environments/environment';
import { Dossier } from '../appTypes';

@Injectable({
    providedIn: 'root'
})
export class DossierService extends AbstractCrudService<Dossier> {
    protected override apiUrl = environment.apiUrl + 'Dossier';

    constructor(http: HttpClient) {
        super(http);
    }

    private flattenDossier(dossier: Dossier): any {
        const flat: any = { ...dossier };

        if (flat.responsableId && typeof flat.responsableId === 'object') {
            flat.responsableId = flat.responsableId.id;
        }

        if (flat.intervenantsIds && Array.isArray(flat.intervenantsIds)) {
            flat.intervenantsIds = flat.intervenantsIds.map((item: any) =>
                (item && typeof item === 'object') ? item.id : item
            );
        }

        if (flat.domaineJuridique && typeof flat.domaineJuridique === 'object') {
            flat.domaineJuridique = flat.domaineJuridique.id;
        }

        if (flat.prioriteID && typeof flat.prioriteID === 'object') {
            flat.prioriteID = flat.prioriteID.id;
        }

        if (flat.statutID && typeof flat.statutID === 'object') {
            flat.statutID = flat.statutID.id;
        }

        return flat;
    }

    override create(item: Dossier): Observable<Dossier> {
        const flat = this.flattenDossier(item);
        return this.http.post<Dossier>(this.apiUrl, flat);
    }

    override update(item: Dossier): Observable<Dossier> {
        const flat = this.flattenDossier(item);
        return this.http.put<Dossier>(this.apiUrl, flat);
    }

    search(filters: any, page: number = 0, size: number = 10, sort?: string): Observable<PaginatedResponse<Dossier>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (sort) {
            params = params.set('sort', sort);
        }

        if (filters) {
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
                    params = params.set(key, filters[key]);
                }
            });
        }

        return this.http.get<PaginatedResponse<Dossier>>(`${this.apiUrl}/search`, { params });
    }
}
