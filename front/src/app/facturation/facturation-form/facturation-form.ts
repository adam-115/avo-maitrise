import { Component, ViewChild } from '@angular/core';
import { FacturationActiviteDialog } from '../facturation-activite-dialog/facturation-activite-dialog';

@Component({
  selector: 'app-facturation-form',
  imports: [FacturationActiviteDialog],
  templateUrl: './facturation-form.html',
  styleUrl: './facturation-form.css'
})
export class FacturationForm {

  @ViewChild(FacturationActiviteDialog)
  facturationActiviteDialog !: FacturationActiviteDialog;

  openModal() {
    this.facturationActiviteDialog.openModal();
  }

   closeModal() {
    this.facturationActiviteDialog.closeModal();
  }

}
