import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractCrudService } from './genericService/abstract-crud.service';
import { environment } from '../../environments/environment';
import { TaskCategory } from '../appTypes';

@Injectable({
    providedIn: 'root'
})
export class TaskCategoryService extends AbstractCrudService<TaskCategory> {
    protected override apiUrl = environment.apiUrl + 'TaskCategory';

    constructor(http: HttpClient) {
        super(http);
    }
}
