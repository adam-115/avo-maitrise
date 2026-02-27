import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractCrudService } from './genericService/abstract-crud.service';
import { environment } from '../../environments/environment';
import { TaskTimeLog } from '../appTypes';

@Injectable({
    providedIn: 'root'
})
export class TaskTimeLogService extends AbstractCrudService<TaskTimeLog> {
    protected override apiUrl = environment.apiUrl + 'TaskTimeLog';

    constructor(http: HttpClient) {
        super(http);
    }
}
