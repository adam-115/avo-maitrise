import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { TypeClient } from '../appTypes';
import { AbstractCrudService } from './genericService/abstract-crud.service';

@Injectable({
  providedIn: 'root',
})
export class TypeClientService extends AbstractCrudService<TypeClient> {
  protected apiUrl = environment.apiUrl + 'type_client'; // Provide your API URL

  constructor(http: HttpClient) {
    super(http);
  }

}
