import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavigationService } from '../../services/navigation-service';
import { AiStatusService } from '../../services/ai-status.service';
import { MailIntegrationStatusService } from '../../services/mail-integration-status.service';
import { TranslatePipe } from '@ngx-translate/core';


@Component({
  selector: 'app-administration',
  imports: [TranslatePipe, CommonModule],
  templateUrl: './administration.html',
  styleUrl: './administration.css'
})
export class Administration {

  navigationService = inject(NavigationService);
  aiStatusService = inject(AiStatusService);
  mailStatusService = inject(MailIntegrationStatusService);
  togglingMailIntegration = false;

  constructor(private readonly router: Router) {
  }

  navigateToUserManagement() {
    this.router.navigate([NavigationService.HOME, NavigationService.UTILISATEURS]);
  }
  navigateToProfileCabinet() {
    this.router.navigate([NavigationService.HOME, NavigationService.PROFILE_CABINET]);
  }

  navigateToDueDiligence() {
    this.navigationService.navigateToDiligenceFormList();
  }

  navigateToIndulgence() {
    this.navigationService.navigateToDiligenceFormList();
  }

  navigateToAdministrationPrefrences(): void {
    this.navigationService.navigateToAdminPrefences();
  }

  navigateToJurisprudenceManagement(): void {
    this.navigationService.navigateToJurisprudenceManagement();
  }

  navigateToAiAssistant(): void {
    this.router.navigate(['home', 'ai-test']);
  }

  navigateToAiConfiguration(): void {
    this.router.navigate(['home', 'ai-configuration']);
  }

  navigateToAuditJournal(): void {
    this.router.navigate(['home', 'audit-journal']);
  }

  navigateToActTemplates(): void {
    this.router.navigate(['home', 'act-templates']);
  }

  navigateToDeadlineRules(): void {
    this.router.navigate(['home', 'deadline-rules']);
  }

  navigateToMessagerie(): void {
    this.router.navigate(['home', 'messagerie']);
  }

  toggleMailIntegration(event: Event): void {
    event.stopPropagation();
    if (this.togglingMailIntegration) return;
    this.togglingMailIntegration = true;
    this.mailStatusService.setEnabled(!this.mailStatusService.isEnabled).subscribe({
      next: () => { this.togglingMailIntegration = false; },
      error: () => { this.togglingMailIntegration = false; }
    });
  }
}
