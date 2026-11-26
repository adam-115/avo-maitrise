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
import { ClientSelectionDialog } from '../dossier/client-selection-dialog/client-selection-dialog';
import { DossierSelectionDialog } from '../dossier/dossier-selection-dialog/dossier-selection-dialog';
import { Dossier } from '../appTypes';

@Component({
  selector: 'app-messagerie',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ClientSelectionDialog, DossierSelectionDialog],
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
  dossiers = signal<Array<{ id: number; referenceInterne: string; titre: string; clientId: number | null; clientName: string; clientEmail: string }>>([]);
  clients = signal<Array<{ id: number; name: string; email: string; count: number }>>([]);

  isLoadingAccounts = signal(false);
  isLoadingInbox = signal(false);
  isLoadingDetail = signal(false);
  isFiling = signal(false);
  isConnectingImap = signal(false);

  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  searchQuery = '';
  selectedClientIdForFiling: number | null = null;
  selectedClientNameForFiling = signal<string | null>(null);
  dossierSearchTerm = '';
  selectedDossierIdForFiling: number | null = null;
  selectedDossierNameForFiling = signal<string | null>(null);
  importAttachments = true;

  // Dialogues de sélection Client & Dossier (identiques à /home/billing/new)
  showClientDialog = signal(false);
  showDossierDialog = signal(false);
  dialogTarget: 'filing' | 'eml' = 'filing';
  dialogClientDossiers = signal<Dossier[]>([]);

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
  emlClientId: number | null = null;
  emlClientName = signal<string | null>(null);
  emlDossierId: number | null = null;
  emlDossierName = signal<string | null>(null);
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
    this.isLoadingAccounts.set(true);
    this.mailService.listAccounts().subscribe({
      next: list => {
        this.isLoadingAccounts.set(false);
        this.accounts.set(list || []);
        if (list && list.length > 0 && !this.selectedAccountId()) {
          this.selectAccount(list[0].id!);
        }
      },
      error: err => {
        this.isLoadingAccounts.set(false);
        this.errorMessage.set(err?.error?.message || 'Impossible de charger les comptes connectés.');
      }
    });
  }

  loadDossiers(): void {
    this.http.get<any>(`${environment.apiUrl}Dossier/search?page=0&size=500`).subscribe({
      next: res => {
        const clientMap = new Map<number, { id: number; name: string; email: string; count: number }>();
        const items = (res?.content || []).map((d: any) => {
          const c = d.client;
          const clientId = c?.id ? Number(c.id) : (d.clientId ? Number(d.clientId) : null);
          const clientName = this.formatClientName(c);
          const clientEmail = c?.email || '';
          if (clientId && clientName) {
            const existing = clientMap.get(clientId);
            if (existing) {
              existing.count++;
            } else {
              clientMap.set(clientId, { id: clientId, name: clientName, email: clientEmail, count: 1 });
            }
          }
          return {
            id: Number(d.id),
            referenceInterne: d.referenceInterne || `DOS-${d.id}`,
            titre: d.titre || '',
            clientId,
            clientName,
            clientEmail
          };
        });
        this.dossiers.set(items);
        this.clients.set(
          Array.from(clientMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'fr'))
        );
        if (items.length > 0 && !this.emlDossierId) {
          this.emlDossierId = items[0].id;
        }
      },
      error: () => {}
    });
  }

  private formatClientName(c: any): string {
    if (!c) return '';
    if (c.nomCommercial) return String(c.nomCommercial).trim();
    const full = `${c.prenom || ''} ${c.nom || ''}`.trim();
    return full || c.email || '';
  }

  get filteredDossiersForFiling() {
    const q = this.dossierSearchTerm.trim().toLowerCase();
    return this.dossiers().filter(d => {
      if (this.selectedClientIdForFiling && d.clientId !== Number(this.selectedClientIdForFiling)) {
        return false;
      }
      if (!q) return true;
      return d.referenceInterne.toLowerCase().includes(q)
        || d.titre.toLowerCase().includes(q)
        || d.clientName.toLowerCase().includes(q)
        || d.clientEmail.toLowerCase().includes(q)
        || String(d.id) === q;
    });
  }

  onFilingClientChange(): void {
    const filtered = this.filteredDossiersForFiling;
    this.selectedDossierIdForFiling = filtered.length > 0 ? filtered[0].id : null;
  }

  onDossierSearchChange(): void {
    const filtered = this.filteredDossiersForFiling;
    if (filtered.length > 0 && !filtered.some(d => d.id === Number(this.selectedDossierIdForFiling))) {
      this.selectedDossierIdForFiling = filtered[0].id;
    } else if (filtered.length === 0) {
      this.selectedDossierIdForFiling = null;
    }
  }

  get filteredDossiersForEml() {
    if (!this.emlClientId) return this.dossiers();
    return this.dossiers().filter(d => d.clientId === Number(this.emlClientId));
  }

  onEmlClientChange(): void {
    const list = this.filteredDossiersForEml;
    this.emlDossierId = list.length > 0 ? list[0].id : null;
  }

  // ==================== DIALOGS CLIENT & DOSSIER (STYLE /home/billing/new) ====================

  openClientDialog(target: 'filing' | 'eml'): void {
    this.dialogTarget = target;
    this.showClientDialog.set(true);
  }

  closeClientDialog(): void {
    this.showClientDialog.set(false);
  }

  onClientDialogSelected(client: any): void {
    if (!client || !client.id) return;
    const clientId = Number(client.id);
    const clientName = this.formatClientName(client) || `Client #${clientId}`;
    this.showClientDialog.set(false);

    if (this.dialogTarget === 'filing') {
      this.selectedClientIdForFiling = clientId;
      this.selectedClientNameForFiling.set(clientName);
      this.selectedDossierIdForFiling = null;
      this.selectedDossierNameForFiling.set(null);
    } else {
      this.emlClientId = clientId;
      this.emlClientName.set(clientName);
      this.emlDossierId = null;
      this.emlDossierName.set(null);
    }

    // Charger les dossiers du client puis ouvrir le dialog de choix du dossier (ou présélectionner s'il n'y en a qu'un)
    this.http.get<any>(`${environment.apiUrl}Dossier/search?client.id=${clientId}&size=100`).subscribe({
      next: res => {
        const list: Dossier[] = res?.content || res || [];
        this.dialogClientDossiers.set(list);
        if (list.length === 1) {
          this.applySelectedDossier(list[0]);
        } else {
          this.showDossierDialog.set(true);
        }
      },
      error: () => {
        this.dialogClientDossiers.set([]);
        this.showDossierDialog.set(true);
      }
    });
  }

  openDossierDialog(target: 'filing' | 'eml'): void {
    this.dialogTarget = target;
    const clientId = target === 'filing' ? this.selectedClientIdForFiling : this.emlClientId;
    if (!clientId) {
      this.openClientDialog(target);
      return;
    }
    this.http.get<any>(`${environment.apiUrl}Dossier/search?client.id=${clientId}&size=100`).subscribe({
      next: res => {
        this.dialogClientDossiers.set(res?.content || res || []);
        this.showDossierDialog.set(true);
      },
      error: () => {
        this.dialogClientDossiers.set([]);
        this.showDossierDialog.set(true);
      }
    });
  }

  closeDossierDialog(): void {
    this.showDossierDialog.set(false);
  }

  onDossierDialogSelected(dossier: any): void {
    if (!dossier || !dossier.id) return;
    this.showDossierDialog.set(false);
    this.applySelectedDossier(dossier);
  }

  private applySelectedDossier(dossier: any): void {
    const id = Number(dossier.id);
    const label = `${dossier.referenceInterne || 'DOS-' + id} — ${dossier.titre || ''}`.trim();
    if (this.dialogTarget === 'filing') {
      this.selectedDossierIdForFiling = id;
      this.selectedDossierNameForFiling.set(label);
    } else {
      this.emlDossierId = id;
      this.emlDossierName.set(label);
    }
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
    this.selectedClientIdForFiling = null;
    this.selectedClientNameForFiling.set(null);
    this.selectedDossierNameForFiling.set(null);
    this.dossierSearchTerm = '';
    if (email.suggestedDossierId) {
      this.selectedDossierIdForFiling = email.suggestedDossierId;
      const match = this.dossiers().find(d => d.id === email.suggestedDossierId);
      if (match) {
        this.selectedDossierNameForFiling.set(`${match.referenceInterne} — ${match.titre}`);
        if (match.clientId) {
          this.selectedClientIdForFiling = match.clientId;
          this.selectedClientNameForFiling.set(match.clientName || `Client #${match.clientId}`);
        }
      } else {
        this.selectedDossierNameForFiling.set(`${email.suggestedDossierReference || ''} — ${email.suggestedDossierTitre || ''}`);
      }
    } else {
      this.selectedDossierIdForFiling = null;
    }
    this.isLoadingDetail.set(true);
    this.mailService.getMessageDetail(accId, email.externalMessageId).subscribe({
      next: full => {
        this.selectedEmail.set(full);
        if (full.suggestedDossierId) {
          this.selectedDossierIdForFiling = full.suggestedDossierId;
          const match = this.dossiers().find(d => d.id === full.suggestedDossierId);
          if (match?.clientId) this.selectedClientIdForFiling = match.clientId;
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
    return this.mailService.getCabinetIcsUrl();
  }

  applyImapPreset(preset: 'gmail' | 'outlook' | 'ovh' | 'infomaniak'): void {
    if (preset === 'gmail') { this.imapHost = 'imap.gmail.com'; this.imapPort = 993; this.imapSsl = true; }
    if (preset === 'outlook') { this.imapHost = 'outlook.office365.com'; this.imapPort = 993; this.imapSsl = true; }
    if (preset === 'ovh') { this.imapHost = 'ssl0.ovh.net'; this.imapPort = 993; this.imapSsl = true; }
    if (preset === 'infomaniak') { this.imapHost = 'mail.infomaniak.com'; this.imapPort = 993; this.imapSsl = true; }
  }
}
