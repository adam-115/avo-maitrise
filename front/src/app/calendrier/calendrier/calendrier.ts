import { CommonModule } from '@angular/common';
import { Component, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CalendrierJour } from "../calendrier-jour/calendrier-jour";
import { CalendrierSemaine } from "../calendrier-semaine/calendrier-semaine";
import { BidirectionalCalendarSyncResult, MailIntegrationService } from '../../services/mail-integration.service';
import { MailIntegrationStatusService } from '../../services/mail-integration-status.service';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-calendrier',
  imports: [CommonModule, FormsModule, RouterModule, CalendrierJour, CalendrierSemaine, TranslatePipe],
  templateUrl: './calendrier.html',
  styleUrl: './calendrier.css'
})
export class Calendrier {
  private mailService = inject(MailIntegrationService);
  public mailStatusService = inject(MailIntegrationStatusService);

  @ViewChild(CalendrierJour) jourView?: CalendrierJour;
  @ViewChild(CalendrierSemaine) semaineView?: CalendrierSemaine;

  selectedView: 'day' | 'week' = 'week';
  showAddAppointementDialog: boolean = false;

  syncingCalendar = false;
  syncResult: BidirectionalCalendarSyncResult | null = null;
  syncError: string | null = null;

  get cabinetIcsUrl(): string {
    return this.mailService.getCabinetIcsUrl();
  }

  syncExternalCalendar(): void {
    if (this.syncingCalendar) return;
    this.syncingCalendar = true;
    this.syncResult = null;
    this.syncError = null;

    this.mailService.syncCalendarBidirectional(30, 90).subscribe({
      next: (res) => {
        this.syncingCalendar = false;
        this.syncResult = res;
        if (res.synced) {
          this.jourView?.loadAppointements();
          this.semaineView?.loadAppointements();
        }
      },
      error: (err) => {
        this.syncingCalendar = false;
        this.syncError = err?.error?.message || 'Erreur lors de la synchronisation avec Google Calendar / Outlook.';
      }
    });
  }

  dismissSyncBanner(): void {
    this.syncResult = null;
    this.syncError = null;
  }
}
