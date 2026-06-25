import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractCrudService } from './genericService/abstract-crud.service';
import { environment } from '../../environments/environment';
import { User } from '../appTypes';

@Injectable({
    providedIn: 'root'
})
export class UserService extends AbstractCrudService<User> {
    protected override apiUrl = environment.apiUrl + 'users';

    constructor(http: HttpClient) {
        super(http);
    }

    disableUser(id: number | string) {
        return this.http.put(`${this.apiUrl}/${id}/disable`, {});
    }

    resetPassword(id: number | string) {
        return this.http.post(`${this.apiUrl}/${id}/reset-password`, {}, { responseType: 'text' });
    }

    reconfigureOtp(id: number | string) {
        return this.http.post(`${this.apiUrl}/${id}/reconfigure-otp`, {});
    }
}

