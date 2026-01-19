import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Paths } from '../paths';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {

  private readonly router = inject(Router);


  navigateTOClients(): void {
    this.router.navigateByUrl(Paths.HOME + '/' + Paths.CRM);
  }

  navigateToClientForm() {
    this.router.navigate([Paths.HOME, Paths.CLIENT_FORM]);
  }

}
