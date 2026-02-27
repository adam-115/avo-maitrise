import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractCrudService } from './genericService/abstract-crud.service';
import { environment } from '../../environments/environment';
import { TaskStatus } from '../appTypes';

@Injectable({
    providedIn: 'root'
})
export class TaskStatusService extends AbstractCrudService<TaskStatus> {
    protected override apiUrl = environment.apiUrl + 'TaskStatus';

    constructor(http: HttpClient) {
        super(http);
    }
}
