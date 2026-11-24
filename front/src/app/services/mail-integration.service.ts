import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MailAccount {
  id?: number;
  ownerUsername?: string;
  provider: 'MICROSOFT' | 'GOOGLE' | 'IMAP';
  emailAddress: string;
  displayName?: string;
  imapHost?: string;
  imapPort?: number;
  imapSsl?: boolean;
  imapUsername?: string;
  imapPassword?: string;
  calendarId?: string;
  calendarSyncEnabled?: boolean;
  active?: boolean;
  supportsCalendarWrite?: boolean;
  lastSyncAt?: string;
  lastError?: string;
  createdAt?: string;
}

export interface EmailAttachmentMeta {
  attachmentId?: string;
  filename: string;
  contentType?: string;
  size?: number;
  documentId?: number | null;
}

export interface InboxEmail {
  externalMessageId: string;
  threadId?: string;
  provider: string;
  fromName?: string;
  fromEmail: string;
  toEmails?: string;
  ccEmails?: string;
  subject: string;
  snippet?: string;
  bodyText?: string;
  bodyHtml?: string;
  sentAt?: string;
  hasAttachments: boolean;
  attachments: EmailAttachmentMeta[];
  filedDossierIds: number[];
  suggestedDossierId?: number | null;
  suggestedDossierReference?: string | null;
  suggestedDossierTitre?: string | null;
  suggestionReason?: string | null;
}

export interface DossierEmail {
  id: number;
  dossierId: number;
  mailAccountId?: number | null;
  provider?: string;
  externalMessageId?: string;
  fromName?: string;
  fromEmail: string;
  toEmails?: string;
  ccEmails?: string;
  subject: string;
  snippet?: string;
  bodyText?: string;
  bodyHtml?: string;
  sentAt?: string;
  filedAt?: string;
  filedBy?: string;
  direction?: string;
  hasAttachments: boolean;
  attachments: EmailAttachmentMeta[];
}

export interface ProvidersStatus {
  microsoftConfigured: boolean;
  googleConfigured: boolean;
  microsoftRedirectUri: string;
  googleRedirectUri: string;
  microsoftScopes: string;
  googleScopes: string;
}

export interface CalendarSyncResult {
  synced: boolean;
  provider?: string;
  externalEventId?: string;
  message: string;
}

export interface BidirectionalCalendarSyncResult {
  synced: boolean;
  provider?: string;
  accountEmail?: string;
  imported: number;
  updated: number;
  pushed: number;
  message: string;
}

export interface MailIntegrationConfig {
  enabled: boolean;
  frontendUrl?: string;
  microsoftClientId?: string;
  microsoftClientSecret?: string;
  hasMicrosoftClientSecret?: boolean;
  clearMicrosoftSecret?: boolean;
  microsoftTenantId?: string;
  microsoftRedirectUri?: string;
  microsoftConfigured?: boolean;
  googleClientId?: string;
  googleClientSecret?: string;
  hasGoogleClientSecret?: boolean;
  clearGoogleSecret?: boolean;
  googleRedirectUri?: string;
  googleConfigured?: boolean;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class MailIntegrationService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}mail-integration`;

  getProvidersStatus(): Observable<ProvidersStatus> {
    return this.http.get<ProvidersStatus>(`${this.baseUrl}/providers/status`);
  }

  getConfig(): Observable<MailIntegrationConfig> {
    return this.http.get<MailIntegrationConfig>(`${this.baseUrl}/config`);
  }

  saveConfig(config: MailIntegrationConfig): Observable<MailIntegrationConfig> {
    return this.http.put<MailIntegrationConfig>(`${this.baseUrl}/config`, config);
  }

  listAccounts(): Observable<MailAccount[]> {
    return this.http.get<MailAccount[]>(`${this.baseUrl}/accounts`);
  }

  connectImap(account: MailAccount): Observable<MailAccount> {
    return this.http.post<MailAccount>(`${this.baseUrl}/accounts/imap`, account);
  }

  toggleCalendarSync(accountId: number, enabled: boolean): Observable<MailAccount> {
    return this.http.patch<MailAccount>(`${this.baseUrl}/accounts/${accountId}/calendar-sync?enabled=${enabled}`, {});
  }

  deleteAccount(accountId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/accounts/${accountId}`);
  }

  getOAuthAuthorizeUrl(provider: 'microsoft' | 'google'): Observable<{ authorizeUrl: string }> {
    return this.http.get<{ authorizeUrl: string }>(`${this.baseUrl}/oauth/${provider}/authorize`);
  }

  listInbox(accountId: number, query?: string, limit = 25): Observable<InboxEmail[]> {
    let params = new HttpParams().set('limit', String(limit));
    if (query && query.trim()) {
      params = params.set('query', query.trim());
    }
    return this.http.get<InboxEmail[]>(`${this.baseUrl}/accounts/${accountId}/inbox`, { params });
  }

  getMessageDetail(accountId: number, messageId: string): Observable<InboxEmail> {
    const params = new HttpParams().set('messageId', messageId);
    return this.http.get<InboxEmail>(`${this.baseUrl}/accounts/${accountId}/messages/detail`, { params });
  }

  fileEmail(accountId: number, externalMessageId: string, dossierId: number, importAttachments = true): Observable<DossierEmail> {
    return this.http.post<DossierEmail>(`${this.baseUrl}/file`, {
      accountId,
      externalMessageId,
      dossierId,
      importAttachments
    });
  }

  importEmlToDossier(dossierId: number, file: File, importAttachments = true): Observable<DossierEmail> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<DossierEmail>(
      `${this.baseUrl}/dossiers/${dossierId}/import-eml?importAttachments=${importAttachments}`,
      formData
    );
  }

  listDossierEmails(dossierId: number | string): Observable<DossierEmail[]> {
    return this.http.get<DossierEmail[]>(`${this.baseUrl}/dossiers/${dossierId}/emails`);
  }

  deleteDossierEmail(emailId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/dossiers/emails/${emailId}`);
  }

  // ===== Calendrier externe & ICS =====

  syncCalendarBidirectional(daysBack = 30, daysAhead = 90): Observable<BidirectionalCalendarSyncResult> {
    const params = new HttpParams()
      .set('daysBack', String(daysBack))
      .set('daysAhead', String(daysAhead));
    return this.http.post<BidirectionalCalendarSyncResult>(`${this.baseUrl}/calendar/sync-all`, {}, { params });
  }

  syncMatterEventToCalendar(eventId: number): Observable<CalendarSyncResult> {
    return this.http.post<CalendarSyncResult>(`${this.baseUrl}/calendar/sync/matter-event/${eventId}`, {});
  }

  syncAppointementToCalendar(appointementId: number): Observable<CalendarSyncResult> {
    return this.http.post<CalendarSyncResult>(`${this.baseUrl}/calendar/sync/appointement/${appointementId}`, {});
  }

  getCabinetIcsUrl(): string {
    return `${this.baseUrl}/calendar/ics/cabinet`;
  }
}
