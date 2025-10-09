import { SaisieTempsDialog } from './../saisie-temps-dialog/saisie-temps-dialog';
import { Component, ViewChild } from '@angular/core';

@Component({
  selector: 'app-saisie-temps',
  imports: [SaisieTempsDialog],
  templateUrl: './saisie-temps.html',
  styleUrl: './saisie-temps.css'
})
export class SaisieTemps {

  @ViewChild(SaisieTempsDialog)
  saisieTempsDialog!: SaisieTempsDialog;

  constructor() { }

  openSaisieTempsModal() {
    this.saisieTempsDialog.openModal();
  }
  closeSaisieTempsModal() {
    this.saisieTempsDialog.closeModal();
  }




}
