import { TacheDetailsDialog } from './../tache-details-dialog/tache-details-dialog';
import { TacheDialog } from './../tache-dialog/tache-dialog';
import { Component, ViewChild } from '@angular/core';

@Component({
  selector: 'app-tache',
  imports: [TacheDialog, TacheDetailsDialog],
  templateUrl: './tache.html',
  styleUrl: './tache.css'
})
export class Tache {

  @ViewChild(TacheDialog)
  tacheDialog!: TacheDialog;

  @ViewChild(TacheDetailsDialog)
  tacheDetailsDialog!: TacheDetailsDialog;

  openTaskCreationModal() {
    this.tacheDialog.openModal();
  }
  closeTaskCreationModal() {
    this.tacheDialog.closeModal();
  }

  openTaskDetailsModal() {
    this.tacheDetailsDialog.openModal();
  }
  closeTaskDetailsModal() {
    this.tacheDetailsDialog.closeModal();
  }

}
