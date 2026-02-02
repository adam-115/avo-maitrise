import { FacturationRelanceDailog } from './../facturation-relance-dailog/facturation-relance-dailog';
import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NavigationService } from '../../services/navigation-service';

@Component({
  selector: 'app-facturation',
  imports: [FacturationRelanceDailog],
  templateUrl: './facturation.html',
  styleUrl: './facturation.css'
})
export class Facturation {

  @ViewChild(FacturationRelanceDailog)
  facturationRelanceDailog !: FacturationRelanceDailog;

  constructor(private readonly router: Router) {

  }

  openRelanceDialog() {
    this.facturationRelanceDailog.openDialog();
  }
  closeRelanceDialog() {
    this.facturationRelanceDailog.closeDialog();
  }

  navigateToFacturationForm() {
    this.router.navigate([NavigationService.HOME, NavigationService.FACTURATION_FORM]);
  }


}
