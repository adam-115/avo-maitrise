import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { AbstractCrudService } from './genericService/abstract-crud.service';
import { AmlFormConfig } from '../appTypes';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AmlFormConfigService extends AbstractCrudService<AmlFormConfig> {

  protected apiUrl = environment.apiUrl + 'AmlFormConfig'; // Provide your API URL

  constructor(http: HttpClient) {
    super(http);
  }


  findFormConfigByClientTypeAndSector(typeClient: string, secteurActivite: string): Observable<AmlFormConfig> {
    return this.http.get<AmlFormConfig>(`${this.apiUrl}/by-client-type-and-sector/${typeClient}/${secteurActivite}`);
  }


}
