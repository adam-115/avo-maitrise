import { SecteurActivite } from './../appTypes';
import { Injectable } from '@angular/core';
import { AbstractCrudService } from './genericService/abstract-crud.service';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class SecteurActiviteService extends AbstractCrudService<SecteurActivite> {
  protected apiUrl = environment.apiUrl + 'SecteurActivite'; // Provide your API URL

  constructor(http: HttpClient) {
    super(http);
  }

}
