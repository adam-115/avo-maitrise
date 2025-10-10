import { Home } from './../../home/home';
import { Paths } from './../../paths';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-administration',
  imports: [],
  templateUrl: './administration.html',
  styleUrl: './administration.css'
})
export class Administration {

  constructor(private readonly router: Router) {
  }

  navigateToUserManagement() {
    this.router.navigate([Paths.HOME, Paths.UTILISATEURS]);
  }
   navigateToProfileCabinet() {
    this.router.navigate([Paths.HOME, Paths.PROFILE_CABINET]);
  }

}
