import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalendrierJour } from "../calendrier-jour/calendrier-jour";
import { CalendrierSemaine } from "../calendrier-semaine/calendrier-semaine";
import { AppointementDialogComponent } from '../appointement-dialog/appointement-dialog';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-calendrier',
  imports: [CommonModule, FormsModule, CalendrierJour, CalendrierSemaine, TranslatePipe],
  templateUrl: './calendrier.html',
  styleUrl: './calendrier.css'
})
export class Calendrier {
  selectedView: 'day' | 'week' = 'week';

  showAddAppointementDialog: boolean = false;





}
