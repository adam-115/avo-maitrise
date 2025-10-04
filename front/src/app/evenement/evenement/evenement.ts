import { EvenementDialog } from './../evenement-dialog/evenement-dialog';
import { Component, ViewChild } from '@angular/core';

@Component({
  selector: 'app-evenement',
  imports: [EvenementDialog],
  templateUrl: './evenement.html',
  styleUrl: './evenement.css'
})
export class Evenement {
  @ViewChild(EvenementDialog)
  evenementDialog!: EvenementDialog;

  openEventCreationModal() {
    this.evenementDialog.openModal();
  }

  closeEventCreationModal() {
    this.evenementDialog.closeModal();
  }

}
