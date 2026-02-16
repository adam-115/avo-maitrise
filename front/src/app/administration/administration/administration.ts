import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NavigationService } from '../../services/navigation-service';


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
    this.router.navigate([NavigationService.HOME, NavigationService.UTILISATEURS]);
  }
  navigateToProfileCabinet() {
    this.router.navigate([NavigationService.HOME, NavigationService.PROFILE_CABINET]);
  }

  navigateToAML() {
    this.navigationService.navigateToFormConfigList();
  }

  navigateToIndulgence() {
    this.navigationService.navigateToDiligenceFormList();
  }

  navigateToAdministrationPrefrences(): void {
    this.navigationService.navigateToAdminPrefences();
  }

}
