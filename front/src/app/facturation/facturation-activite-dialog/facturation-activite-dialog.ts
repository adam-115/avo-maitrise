import { Component } from '@angular/core';

@Component({
  selector: 'app-facturation-activite-dialog',
  imports: [],
  templateUrl: './facturation-activite-dialog.html',
  styleUrl: './facturation-activite-dialog.css'
})
export class FacturationActiviteDialog {

  showModal = false;

  openModal() {
    this.showModal = true;
  }
  closeModal() {
    this.showModal = false;
  }

}
