import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Paths } from '../../paths';

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
    this.router.navigate([Paths.HOME,]);
  }

}
