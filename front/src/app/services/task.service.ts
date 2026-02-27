import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractCrudService } from './genericService/abstract-crud.service';
import { environment } from '../../environments/environment';
import { Task } from '../appTypes';

@Injectable({
    providedIn: 'root'
})
export class TaskService extends AbstractCrudService<Task> {
    protected override apiUrl = environment.apiUrl + 'Task';

    constructor(http: HttpClient) {
        super(http);
    }
}
