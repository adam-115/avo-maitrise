import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MailIntegrationConfig, MailIntegrationService } from '../../services/mail-integration.service';
import { MailIntegrationStatusService } from '../../services/mail-integration-status.service';

@Component({
  selector: 'app-mail-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './mail-configuration.component.html'
})
export class MailConfigurationComponent implements OnInit {
  private mailService = inject(MailIntegrationService);
  private statusService = inject(MailIntegrationStatusService);
  private router = inject(Router);

  isLoading = signal(false);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  copiedField = signal<string | null>(null);
  showGoogleGuide = signal(false);
  showMicrosoftGuide = signal(false);

  config: MailIntegrationConfig = {
    enabled: false,
    frontendUrl: 'http://localhost:8080',
    googleClientId: '',
    googleClientSecret: '',
    googleRedirectUri: 'http://localhost:8080/api/mail-integration/oauth/google/callback',
    microsoftClientId: '',
    microsoftClientSecret: '',
    microsoftTenantId: 'common',
    microsoftRedirectUri: 'http://localhost:8080/api/mail-integration/oauth/microsoft/callback'
  };

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.mailService.getConfig().subscribe({
      next: cfg => {
        this.config = {
          ...cfg,
          googleClientSecret: '',
          microsoftClientSecret: '',
          clearGoogleSecret: false,
          clearMicrosoftSecret: false
        };
        this.isLoading.set(false);
      },
      error: err => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message || 'Impossible de charger la configuration messagerie.');
      }
    });
  }

  save(): void {
    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.mailService.saveConfig(this.config).subscribe({
      next: saved => {
        this.config = {
          ...saved,
          googleClientSecret: '',
          microsoftClientSecret: '',
          clearGoogleSecret: false,
          clearMicrosoftSecret: false
        };
        this.statusService.checkStatus();
        this.isSaving.set(false);
        this.successMessage.set('Configuration enregistrée et appliquée à chaud (aucun redémarrage requis).');
      },
      error: err => {
        this.isSaving.set(false);
        this.errorMessage.set(err?.error?.message || 'Erreur lors de la sauvegarde de la configuration.');
      }
    });
  }

  copyValue(value: string | undefined, key: string): void {
    if (!value) return;
    navigator.clipboard?.writeText(value);
    this.copiedField.set(key);
    setTimeout(() => {
      if (this.copiedField() === key) this.copiedField.set(null);
    }, 2000);
  }

  goBack(): void {
    this.router.navigate(['/home/administration']);
  }

  openMessagerie(): void {
    this.router.navigate(['/home/messagerie']);
  }
}
