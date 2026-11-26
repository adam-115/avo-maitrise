import { Component, Input, OnChanges, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DossierEmail, MailIntegrationService } from '../../services/mail-integration.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dossier-emails',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dossier-emails.component.html'
})
export class DossierEmailsComponent implements OnInit, OnChanges {
  @Input() dossierId!: string | number;
  @Input() selectedDossier: any;

  private mailService = inject(MailIntegrationService);

  emails = signal<DossierEmail[]>([]);
  expandedId = signal<number | null>(null);
  isLoading = signal(false);
  isUploading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  apiBase = environment.apiUrl;

  ngOnInit(): void {
    this.loadEmails();
  }

  ngOnChanges(): void {
    this.loadEmails();
  }

  loadEmails(): void {
    if (!this.dossierId) return;
    this.isLoading.set(true);
    this.mailService.listDossierEmails(this.dossierId).subscribe({
      next: list => {
        this.emails.set(list || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  toggleExpand(id: number): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  onEmlUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.dossierId) return;
    this.isUploading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.mailService.importEmlToDossier(Number(this.dossierId), file, true).subscribe({
      next: saved => {
        this.isUploading.set(false);
        input.value = '';
        this.successMessage.set(`E-mail « ${saved.subject} » importé dans le dossier.`);
        this.loadEmails();
      },
      error: err => {
        this.isUploading.set(false);
        this.errorMessage.set(err?.error?.message || 'Erreur lors de l\'import du fichier .eml.');
      }
    });
  }

  deleteEmail(email: DossierEmail): void {
    if (!confirm(`Retirer l'e-mail « ${email.subject} » de ce dossier ?`)) return;
    this.mailService.deleteDossierEmail(email.id).subscribe({
      next: () => {
        this.emails.update(list => list.filter(e => e.id !== email.id));
        this.successMessage.set('E-mail retiré du dossier.');
      },
      error: () => this.errorMessage.set('Impossible de supprimer cet e-mail.')
    });
  }
}
