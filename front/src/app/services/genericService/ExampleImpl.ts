import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractCrudService } from './abstract-crud.service';
import { User } from '../../appTypes';


@Injectable({
  providedIn: 'root'
})
export class ExampleService extends AbstractCrudService<User> {
  protected apiUrl = 'http://localhost:8080/api/users'; // Provide your API URL

  constructor(http: HttpClient) {
    super(http);
  }
}
