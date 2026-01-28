import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { AbstractCrudService } from './genericService/abstract-crud.service';
import { AmlFormConfig } from '../appTypes';

@Injectable({
  providedIn: 'root',
})
export class AmlFormConfigService extends AbstractCrudService<AmlFormConfig> {

  protected apiUrl = environment.apiUrl + 'AmlFormConfig'; // Provide your API URL

  constructor(http: HttpClient) {
    super(http);
  }

}
