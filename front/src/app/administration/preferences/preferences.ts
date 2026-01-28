import { Component, inject } from '@angular/core';
import { NavigationService } from '../../services/navigation-service';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-preferences',
  imports: [],
  templateUrl: './preferences.html',
  styleUrl: './preferences.css',
})
export class Preferences {

  navigationService = inject(NavigationService);



    navigateBackToAdmin() {
  throw ("not yet implemented");
}

navigateToClientTypesPreferences() {
  this.navigationService.navigateToPrefrenceTypeClient();
}

navigateToAdminSecteurActivite(){
  this.navigationService.navigateToAdminSecteurActivite();
}

}
