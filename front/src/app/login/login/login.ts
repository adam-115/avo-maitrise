import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NavigationService } from '../../services/navigation-service';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  constructor(private readonly router: Router) {
  }

  navigateToHomePage() {
    this.router.navigate([NavigationService.HOME,]);
  }

}
