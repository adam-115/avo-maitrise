import { Injectable } from '@angular/core';
import { AbstractCrudService } from './genericService/abstract-crud.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AmlFormResult } from '../appTypes';

@Injectable({
  providedIn: 'root',
})
export class AmlFormResultService extends AbstractCrudService<AmlFormResult>{
  protected apiUrl = environment.apiUrl+'AmlFormResult'; // Provide your API URL



  constructor(http: HttpClient) {
    super(http);
  }

}
