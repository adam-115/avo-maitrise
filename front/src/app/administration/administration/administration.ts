import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NavigationService } from '../../services/navigation-service';
import { Paths } from './../../paths';

@Component({
  selector: 'app-administration',
  imports: [],
  templateUrl: './administration.html',
  styleUrl: './administration.css'
})
export class Administration {

  navigationService = inject(NavigationService);

  constructor(private readonly router: Router) {
  }

  navigateToUserManagement() {
    this.router.navigate([Paths.HOME, Paths.UTILISATEURS]);
  }
  navigateToProfileCabinet() {
    this.router.navigate([Paths.HOME, Paths.PROFILE_CABINET]);
  }

  navigateToAML() {
    this.navigationService.navigateToFormConfigList();
  }

  navigateToAdministrationPrefrences(): void {
    this.navigationService.navigateToAdminPrefences();
  }

}
