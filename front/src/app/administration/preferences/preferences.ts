import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavigationService } from '../../services/navigation-service';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe, TranslateDirective],
  templateUrl: './preferences.html',
  styleUrl: './preferences.css',
})
export class Preferences {

  navigationService = inject(NavigationService);

  navigateBackToAdmin() {
    throw ("not yet implemented");
  }


  navigateToAdminSecteurActivite() {
    this.navigationService.navigateToAdminSecteurActivite();
  }

  navigateToDossierStatusForm() {
    this.navigationService.navigateToDossierStatusForm();
  }

  navigateToDossierPriorite() {
    this.navigationService.navigateToDossierPriorite();
  }

  navigateToDomaineJuridique() {
    this.navigationService.navigateToDomaineJuridique();
  }

  navigateToTaskCategory() {
    this.navigationService.navigateToTaskCategory();
  }

  navigateToTaskStatus() {
    this.navigationService.navigateToTaskStatus();
  }

  navigateToNoteCategory() {
    this.navigationService.navigateToNoteCategory();
  }

  navigateToEventType() {
    this.navigationService.navigateToEventType();
  }

  navigateToInvoiceTypeOfServiceForm() {
    this.navigationService.navigateToInvoiceTypeOfServiceForm();
  }

}
