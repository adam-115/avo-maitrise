import { Component } from '@angular/core';

@Component({
  selector: 'app-saisie-temps-dialog',
  imports: [],
  templateUrl: './saisie-temps-dialog.html',
  styleUrl: './saisie-temps-dialog.css'
})
export class SaisieTempsDialog {

  showModal: boolean = false;

  constructor() { }
  openModal() {
    this.showModal = true;
  }
  closeModal() {
    this.showModal = false;
  }

}
