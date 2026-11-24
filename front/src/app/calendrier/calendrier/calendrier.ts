import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CalendrierJour } from "../calendrier-jour/calendrier-jour";
import { CalendrierSemaine } from "../calendrier-semaine/calendrier-semaine";
import { MailIntegrationService } from '../../services/mail-integration.service';
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
  selectedView: 'day' | 'week' = 'week';

  showAddAppointementDialog: boolean = false;

  get cabinetIcsUrl(): string {
    return this.mailService.getCabinetIcsUrl(90);
  }
}
