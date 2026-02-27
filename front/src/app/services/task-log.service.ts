import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractCrudService } from './genericService/abstract-crud.service';
import { environment } from '../../environments/environment';
import { TaskLog } from '../appTypes';

@Injectable({
    providedIn: 'root'
})
export class TaskLogService extends AbstractCrudService<TaskLog> {
    protected override apiUrl = environment.apiUrl + 'TaskLog';

    constructor(http: HttpClient) {
        super(http);
    }
}
