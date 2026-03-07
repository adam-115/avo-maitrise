import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NavigationService } from '../../services/navigation-service';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  private readonly navigationService = inject(NavigationService);

  constructor(private readonly router: Router) {
  }

  navigateToHomePage() {
    this.navigationService.navigateToClients();
  }

}
