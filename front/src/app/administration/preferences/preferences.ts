import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavigationService } from '../../services/navigation-service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslatePipe],
  templateUrl: './preferences.html',
  styleUrl: './preferences.css',
})
export class Preferences {
  private readonly router = inject(Router);
  navigationService = inject(NavigationService);

  searchTerm: string = '';

  navigateBackToAdmin() {
    this.router.navigate([NavigationService.HOME, NavigationService.ADMINSTRATION]);
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
