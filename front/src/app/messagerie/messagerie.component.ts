import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  InboxEmail,
  MailAccount,
  MailIntegrationService,
  ProvidersStatus
} from '../services/mail-integration.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-messagerie',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './messagerie.component.html'
})
export class MessagerieComponent implements OnInit {
  private mailService = inject(MailIntegrationService);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  providersStatus = signal<ProvidersStatus | null>(null);
  accounts = signal<MailAccount[]>([]);
  selectedAccountId = signal<number | null>(null);
  inbox = signal<InboxEmail[]>([]);
  selectedEmail = signal<InboxEmail | null>(null);
  dossiers = signal<Array<{ id: number; referenceInterne: string; titre: string }>>([]);

  isLoadingInbox = signal(false);
  isLoadingDetail = signal(false);
  isFiling = signal(false);
  isConnectingImap = signal(false);

  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  searchQuery = '';
  selectedDossierIdForFiling: number | null = null;
  importAttachments = true;

  // Formulaire IMAP
  showImapForm = false;
  imapEmail = '';
  imapDisplayName = '';
  imapHost = 'imap.gmail.com';
  imapPort = 993;
  imapSsl = true;
  imapUsername = '';
  imapPassword = '';

  // Import .eml direct
  emlDossierId: number | null = null;
  isUploadingEml = signal(false);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['oauthSuccess']) {
        this.successMessage.set(`Compte ${params['oauthSuccess']} (${params['email'] || ''}) connecté avec succès (E-mails lecture seule + Calendrier écriture).`);
      }
      if (params['oauthError']) {
        this.errorMessage.set(`Erreur de connexion OAuth2 : ${params['oauthError']}`);
      }
    });

    this.loadProvidersStatus();
    this.loadAccounts();
    this.loadDossiers();
  }

  loadProvidersStatus(): void {
    this.mailService.getProvidersStatus().subscribe({
      next: status => this.providersStatus.set(status),
      error: () => {}
    });
  }

  loadAccounts(): void {
    this.mailService.listAccounts().subscribe({
      next: list => {
        this.accounts.set(list || []);
        if (list && list.length > 0 && !this.selectedAccountId()) {
          this.selectAccount(list[0].id!);
        }
      },
      error: err => this.errorMessage.set(err?.error?.message || 'Impossible de charger les comptes connectés.')
    });
  }

  loadDossiers(): void {
    this.http.get<any>(`${environment.apiUrl}Dossier/search?page=0&size=200`).subscribe({
      next: res => {
        const items = (res?.content || []).map((d: any) => ({
          id: Number(d.id),
          referenceInterne: d.referenceInterne || `DOS-${d.id}`,
          titre: d.titre || ''
        }));
        this.dossiers.set(items);
        if (items.length > 0 && !this.emlDossierId) {
          this.emlDossierId = items[0].id;
        }
      },
      error: () => {}
    });
  }

  connectOAuth(provider: 'microsoft' | 'google'): void {
    this.errorMessage.set(null);
    this.mailService.getOAuthAuthorizeUrl(provider).subscribe({
      next: res => {
        if (res?.authorizeUrl) {
          window.location.href = res.authorizeUrl;
        }
      },
      error: err => this.errorMessage.set(err?.error?.message || `Configuration OAuth2 ${provider} manquante sur le serveur.`)
    });
  }

  connectImap(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.isConnectingImap.set(true);
    this.mailService.connectImap({
      provider: 'IMAP',
      emailAddress: this.imapEmail,
      displayName: this.imapDisplayName || this.imapEmail,
      imapHost: this.imapHost,
      imapPort: Number(this.imapPort) || 993,
      imapSsl: this.imapSsl,
      imapUsername: this.imapUsername || this.imapEmail,
      imapPassword: this.imapPassword
    }).subscribe({
      next: acc => {
        this.isConnectingImap.set(false);
        this.showImapForm = false;
        this.imapPassword = '';
        this.successMessage.set(`Boîte IMAP ${acc.emailAddress} connectée en lecture seule.`);
        this.loadAccounts();
        if (acc.id) this.selectAccount(acc.id);
      },
      error: err => {
        this.isConnectingImap.set(false);
        this.errorMessage.set(err?.error?.message || 'Connexion IMAP échouée. Vérifiez vos paramètres.');
      }
    });
  }

  toggleCalendarSync(account: MailAccount): void {
    if (!account.id) return;
    const nextVal = !account.calendarSyncEnabled;
    this.mailService.toggleCalendarSync(account.id, nextVal).subscribe({
      next: updated => {
        this.accounts.update(list => list.map(a => a.id === updated.id ? updated : a));
        this.successMessage.set(nextVal
          ? `Synchronisation calendrier activée pour ${updated.emailAddress}.`
          : `Synchronisation calendrier désactivée pour ${updated.emailAddress}.`);
      },
      error: () => this.errorMessage.set('Impossible de modifier la synchronisation calendrier.')
    });
  }

  disconnectAccount(account: MailAccount): void {
    if (!account.id) return;
    if (!confirm(`Déconnecter le compte ${account.emailAddress} ? Les e-mails déjà classés dans les dossiers seront conservés.`)) {
      return;
    }
    this.mailService.deleteAccount(account.id).subscribe({
      next: () => {
        this.accounts.update(list => list.filter(a => a.id !== account.id));
        if (this.selectedAccountId() === account.id) {
          this.selectedAccountId.set(null);
          this.inbox.set([]);
          this.selectedEmail.set(null);
        }
        this.successMessage.set('Compte déconnecté.');
      }
    });
  }

  selectAccount(accountId: number): void {
    this.selectedAccountId.set(accountId);
    this.selectedEmail.set(null);
    this.refreshInbox();
  }

  refreshInbox(): void {
    const accId = this.selectedAccountId();
    if (!accId) return;
    this.isLoadingInbox.set(true);
    this.errorMessage.set(null);
    this.mailService.listInbox(accId, this.searchQuery, 25).subscribe({
      next: msgs => {
        this.inbox.set(msgs || []);
        this.isLoadingInbox.set(false);
      },
      error: err => {
        this.isLoadingInbox.set(false);
        this.errorMessage.set(err?.error?.message || 'Impossible de lire la boîte de réception.');
      }
    });
  }

  openEmail(email: InboxEmail): void {
    const accId = this.selectedAccountId();
    if (!accId) return;
    this.selectedEmail.set(email);
    this.selectedDossierIdForFiling = email.suggestedDossierId || (this.dossiers()[0]?.id ?? null);
    this.isLoadingDetail.set(true);
    this.mailService.getMessageDetail(accId, email.externalMessageId).subscribe({
      next: full => {
        this.selectedEmail.set(full);
        if (full.suggestedDossierId) {
          this.selectedDossierIdForFiling = full.suggestedDossierId;
        }
        this.isLoadingDetail.set(false);
      },
      error: () => this.isLoadingDetail.set(false)
    });
  }

  fileEmailToDossier(email: InboxEmail, dossierId?: number | null): void {
    const accId = this.selectedAccountId();
    const targetDossierId = dossierId ?? this.selectedDossierIdForFiling;
    if (!accId || !targetDossierId) {
      this.errorMessage.set('Veuillez sélectionner un dossier de destination.');
      return;
    }
    this.isFiling.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.mailService.fileEmail(accId, email.externalMessageId, Number(targetDossierId), this.importAttachments).subscribe({
      next: saved => {
        this.isFiling.set(false);
        const dossier = this.dossiers().find(d => d.id === Number(targetDossierId));
        const label = dossier ? `${dossier.referenceInterne} — ${dossier.titre}` : `#${targetDossierId}`;
        const pj = saved.attachments?.length ? ` (+ ${saved.attachments.length} PJ dans la GED)` : '';
        this.successMessage.set(`E-mail classé dans le dossier ${label}${pj}.`);
        // Mettre à jour le badge "Déjà classé" dans la liste
        this.inbox.update(list => list.map(m => m.externalMessageId === email.externalMessageId
          ? { ...m, filedDossierIds: Array.from(new Set([...(m.filedDossierIds || []), Number(targetDossierId)])) }
          : m));
        if (this.selectedEmail()?.externalMessageId === email.externalMessageId) {
          this.selectedEmail.update(cur => cur
            ? { ...cur, filedDossierIds: Array.from(new Set([...(cur.filedDossierIds || []), Number(targetDossierId)])) }
            : cur);
        }
      },
      error: err => {
        this.isFiling.set(false);
        this.errorMessage.set(err?.error?.message || 'Erreur lors du classement de l\'e-mail.');
      }
    });
  }

  onEmlFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.emlDossierId) return;
    this.isUploadingEml.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.mailService.importEmlToDossier(Number(this.emlDossierId), file, true).subscribe({
      next: saved => {
        this.isUploadingEml.set(false);
        input.value = '';
        this.successMessage.set(`Fichier .eml « ${saved.subject} » classé dans le dossier #${this.emlDossierId}.`);
      },
      error: err => {
        this.isUploadingEml.set(false);
        this.errorMessage.set(err?.error?.message || 'Impossible d\'importer ce fichier .eml.');
      }
    });
  }

  get cabinetIcsUrl(): string {
    return this.mailService.getCabinetIcsUrl(90);
  }

  applyImapPreset(preset: 'gmail' | 'outlook' | 'ovh' | 'infomaniak'): void {
    if (preset === 'gmail') { this.imapHost = 'imap.gmail.com'; this.imapPort = 993; this.imapSsl = true; }
    if (preset === 'outlook') { this.imapHost = 'outlook.office365.com'; this.imapPort = 993; this.imapSsl = true; }
    if (preset === 'ovh') { this.imapHost = 'ssl0.ovh.net'; this.imapPort = 993; this.imapSsl = true; }
    if (preset === 'infomaniak') { this.imapHost = 'mail.infomaniak.com'; this.imapPort = 993; this.imapSsl = true; }
  }
}
